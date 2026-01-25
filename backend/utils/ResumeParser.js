const pdfParse = require('pdf-parse');
// const pdfParse = require("pdf-parse/lib/pdf-parse");
console.log(typeof pdfParse);
const mammoth = require('mammoth');

class ResumeParser {
  async parseResume(fileBuffer, fileType) {
    let text = '';
    
    try {
      if (fileType === 'application/pdf') {
        const data = await pdfParse(fileBuffer);
        text = data.text;
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file type');
      }
      
      return this.extractFields(text);
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw error;
    }
  }
  
  extractFields(text) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    return {
      // Basic Information
      firstName: this.extractFirstName(cleanText),
      middleName: this.extractMiddleName(cleanText),
      lastName: this.extractLastName(cleanText),
      email: this.extractEmail(cleanText),
      phone: this.extractPhone(cleanText),
      alternatePhone: this.extractAlternatePhone(cleanText),
      address: this.extractAddress(cleanText),
      dateOfBirth: this.extractDateOfBirth(cleanText),
      gender: this.extractGender(cleanText),
      nationality: this.extractNationality(cleanText),
      
      // Government IDs
      aadharNumber: this.extractAadhar(cleanText),
      panNumber: this.extractPAN(cleanText),
      
      // Maritime IDs
      cdcNumber: this.extractCDC(cleanText),
      indosNumber: this.extractIndos(cleanText),
      passportNumber: this.extractPassport(cleanText),
      passportPlaceOfIssue: this.extractPassportPlace(cleanText),
      seamanBookNumber: this.extractSeamanBook(cleanText),
      
      // Professional
      rank: this.extractRank(cleanText),
      
      // Metadata
      _confidence: this.calculateConfidence(cleanText),
      _rawText: text.substring(0, 3000),
    };
  }
  
  // === BASIC INFORMATION ===
  
  extractFirstName(text) {
    // Try "First Name : ASHISH" or "Surname :SINGH First Name :ASHISH"
    let match = text.match(/First\s*Name\s*[:\-]?\s*([A-Z][a-z]+)/i);
    if (match) return this.toTitleCase(match[1]);
    
    // Try "NAME : RAVIKUMARGUPTA" and split
    match = text.match(/NAME\s*[:\-]?\s*([A-Z][A-Z\s]+)/i);
    if (match) {
      const fullName = match[1].trim();
      // If all caps, try to intelligently split
      const parts = this.splitFullName(fullName);
      return parts.firstName || '';
    }
    
    // Try "Name: Ranaware Nilesh Arun" (surname first)
    match = text.match(/Name\s*[:\-]?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/i);
    if (match) return this.toTitleCase(match[2]); // Second word is first name
    
    return '';
  }
  
  extractMiddleName(text) {
    // Try explicit "Middle Name : KUMAR"
    let match = text.match(/Middle\s*Name\s*[:\-]?\s*([A-Z][a-z]+)/i);
    if (match) return this.toTitleCase(match[1]);
    
    // Try "Name: Ranaware Nilesh Arun" (3 parts)
    match = text.match(/Name\s*[:\-]?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/i);
    if (match) return this.toTitleCase(match[3]); // Third is middle/last
    
    return '';
  }
  
  extractLastName(text) {
    // Try "Surname :SINGH"
    let match = text.match(/Surname\s*[:\-]?\s*([A-Z][a-z]+)/i);
    if (match) return this.toTitleCase(match[1]);
    
    // Try "NAME : RAVIKUMARGUPTA"
    match = text.match(/NAME\s*[:\-]?\s*([A-Z][A-Z\s]+)/i);
    if (match) {
      const fullName = match[1].trim();
      const parts = this.splitFullName(fullName);
      return parts.lastName || '';
    }
    
    // Try "Name: Ranaware Nilesh Arun"
    match = text.match(/Name\s*[:\-]?\s*([A-Z][a-z]+)/i);
    if (match) return this.toTitleCase(match[1]); // First word is surname
    
    return '';
  }
  
  splitFullName(fullName) {
    // For names like "RAVIKUMARGUPTA", try to intelligently split
    // Look for common patterns
    const name = fullName.replace(/\s+/g, '');
    
    // Simple heuristic: if no spaces, assume FirstLast format
    if (name.length > 6) {
      const mid = Math.floor(name.length / 2);
      return {
        firstName: this.toTitleCase(name.substring(0, mid)),
        lastName: this.toTitleCase(name.substring(mid))
      };
    }
    
    return { firstName: this.toTitleCase(name), lastName: '' };
  }
  
  extractEmail(text) {
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.-]+/gi;
    const matches = text.match(emailRegex);
    return matches ? matches[0].toLowerCase() : '';
  }
  
  extractPhone(text) {
    // Indian numbers: patterns like 9766009674, 6388332161, +91 9467711531
    const patterns = [
      /(?:\+91|91)?[\s-]?([6-9]\d{9})/,
      /(?:Tel|Mobile|Contact|Phone)\s*(?:No\.?|Number)?[:\s-]*(\d{10})/i,
      /Cell[:\s]*(\d{10})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return '';
  }
  
  extractAlternatePhone(text) {
    // Find all phone numbers, return second one
    const phoneRegex = /(?:\+91|91)?[\s-]?([6-9]\d{9})/g;
    const matches = [...text.matchAll(phoneRegex)];
    
    if (matches.length > 1) {
      return matches[1][1];
    }
    return '';
  }
  
  extractAddress(text) {
    const patterns = [
      /(?:Permanent|Present|Residential)\s*Address\s*[:\-]?\s*([^\n]+(?:\n[^\n]+){0,2})/i,
      /Address\s*[:\-]?\s*([^\n]+(?:\n[^\n]+){0,2})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, ' ').substring(0, 200);
      }
    }
    return '';
  }
  
  extractDateOfBirth(text) {
    const patterns = [
      /Date\s*of\s*Birth\s*[:\-]?\s*(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s*\d{4})/i,
      /Date\s*of\s*Birth\s*[:\-]?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /D\.?O\.?B\.?\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]+\.?\s+\d{4})/i,
      /Date\s*of\s*Birth\s*[:\-]?\s*(\d{4}-\d{2}-\d{2})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return '';
  }
  
  extractGender(text) {
    const match = text.match(/(?:Sex|Gender)[:\s]*([A-Za-z]+)/i);
    if (match) {
      const gender = match[1].toLowerCase();
      if (gender.includes('male') && !gender.includes('female')) return 'Male';
      if (gender.includes('female')) return 'Female';
    }
    return '';
  }
  
  extractNationality(text) {
    const match = text.match(/Nationality\s*[:\-]?\s*([A-Z][a-z]+)/i);
    return match ? this.toTitleCase(match[1]) : 'Indian';
  }
  
  // === GOVERNMENT IDs ===
  
  extractAadhar(text) {
    // Aadhar: 12 digit number, often written with spaces
    const patterns = [
      /Aadhar\s*(?:No\.?|Number|Card)?[:\s]*(\d{4}\s?\d{4}\s?\d{4})/i,
      /\b(\d{4}\s?\d{4}\s?\d{4})\b/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].replace(/\s/g, '');
      }
    }
    return '';
  }
  
  extractPAN(text) {
    // PAN: 10 alphanumeric (AAAAA9999A)
    const panRegex = /PAN\s*(?:No\.?|Number|Card)?[:\s]*([A-Z]{5}\d{4}[A-Z])/i;
    const match = text.match(panRegex);
    return match ? match[1].toUpperCase() : '';
  }
  
  // === MARITIME IDs ===
  
  extractCDC(text) {
    // Patterns: "CDC CHN 106682", "CDC: MUM339172", "MUM305589"
    const patterns = [
      /CDC\s*(?:No\.?|Number)?[:\s]*([A-Z]{3}\s?\d{6})/i,
      /CDC\s*([A-Z]{3}\d{6})/i,
      /Seaman'?s?\s*Book[:\s]*([A-Z]{3}\s?\d{6})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].replace(/\s/g, '').toUpperCase();
      }
    }
    return '';
  }
  
  extractIndos(text) {
    // Patterns: "15NL1287", "INDOS: 18AL1239"
    const patterns = [
      /INDOS\s*(?:No\.?|Number)?[:\s]*(\d{2}[A-Z]{2}\d{4})/i,
      /\b(\d{2}[A-Z]{2}\d{4})\b/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].toUpperCase();
        // Verify format: 2 digits, 2 letters, 4 digits
        if (/^\d{2}[A-Z]{2}\d{4}$/.test(value)) {
          return value;
        }
      }
    }
    return '';
  }
  
  extractPassport(text) {
    // Indian Passport: Letter + 7 digits (P8758463, R2457638)
    const patterns = [
      /Passport\s*(?:No\.?|Number)?[:\s]*([A-Z]\d{7})/i,
      /\b([A-Z]\d{7})\b/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1].toUpperCase();
        if (/^[A-Z]\d{7}$/.test(value)) {
          return value;
        }
      }
    }
    return '';
  }
  
  extractPassportPlace(text) {
    const match = text.match(/(?:Place\s*of\s*Issue|Issued\s*at)[:\s]*([A-Z][a-z]+)/i);
    return match ? this.toTitleCase(match[1]) : '';
  }
  
  extractSeamanBook(text) {
    const patterns = [
      /Seaman'?s?\s*Book\s*(?:No\.?|Number)?[:\s]*([A-Z0-9-]+)/i,
      /SID\s*(?:No\.?|Number)?[:\s]*([A-Z0-9]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }
    return '';
  }
  
  // === PROFESSIONAL ===
  
  extractRank(text) {
    const maritimeRanks = [
      'Master', 'Chief Officer', 'Second Officer', 'Third Officer',
      'Chief Engineer', 'Second Engineer', 'Third Engineer', 'Fourth Engineer',
      'Trainee Marine Engineer', 'TME', 'ETO', 'Electro Technical Officer',
      'Deck Cadet', 'Engine Cadet',
      'Bosun', 'Able Seaman', 'AB', 'Ordinary Seaman', 'OS',
      'Oiler', 'Fitter', 'Wiper', 'Cook', 'Steward', 'Rating',
      'ROV Pilot', 'ROV Technician', 'ROV Senior Pilot'
    ];
    
    // Try explicit patterns
    let match = text.match(/(?:Post\s*Applied\s*for|Position|Rank|COMPETENCY)\s*[:\-]?\s*([^\n]+)/i);
    if (match) {
      const position = match[1].trim();
      for (const rank of maritimeRanks) {
        if (position.toLowerCase().includes(rank.toLowerCase())) {
          return rank;
        }
      }
      // Return the extracted position even if not in our list
      return position.substring(0, 50);
    }
    
    // Fallback: Search for rank keywords
    for (const rank of maritimeRanks) {
      if (text.toLowerCase().includes(rank.toLowerCase())) {
        return rank;
      }
    }
    
    return '';
  }
  
  // === UTILITIES ===
  
  toTitleCase(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  calculateConfidence(text) {
    let score = 0;
    
    // High value fields
    if (this.extractCDC(text)) score += 25;
    if (this.extractIndos(text)) score += 25;
    if (this.extractPassport(text)) score += 20;
    if (this.extractEmail(text)) score += 15;
    if (this.extractPhone(text)) score += 10;
    if (this.extractRank(text)) score += 5;
    
    return score;
  }
}

module.exports = new ResumeParser();