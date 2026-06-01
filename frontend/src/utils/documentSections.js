/** Shared helpers for flat vs versioned (main/old) file metadata in modals and tables. */

export function hasStoredFile(file) {
  if (!file) return false;
  const path = file.path != null ? String(file.path).trim() : "";
  const filename = file.filename != null ? String(file.filename).trim() : "";
  return Boolean(path || filename);
}

/** Normalize flat file or { main, old } into { main, old? } for DocumentSection. */
export function normalizeDocSection(doc) {
  if (!doc) return null;

  if (hasStoredFile(doc.main) || hasStoredFile(doc.old)) {
    return {
      main: doc.main,
      ...(hasStoredFile(doc.old) ? { old: doc.old } : {}),
    };
  }

  if (hasStoredFile(doc)) {
    return { main: doc };
  }

  return null;
}

export function sectionHasFiles(documents) {
  const n = normalizeDocSection(documents);
  return hasStoredFile(n?.main) || hasStoredFile(n?.old);
}

export function countFilesInSection(doc) {
  const n = normalizeDocSection(doc);
  if (!n) return 0;
  let count = 0;
  if (hasStoredFile(n.main)) count += 1;
  if (hasStoredFile(n.old)) count += 1;
  return count;
}

export function countCandidateFiles(documents = {}) {
  return Object.values(documents).reduce(
    (sum, doc) => sum + countFilesInSection(doc),
    0,
  );
}

export function countVesselOwnerFiles(entity = {}) {
  return (
    countFilesInSection(entity.contract) +
    countFilesInSection(entity.license) +
    countFilesInSection(entity.company_logo)
  );
}

export function countVesselFiles(entity = {}) {
  return (
    countFilesInSection(entity.vessel_documents) +
    countFilesInSection(entity.vessel_image)
  );
}

const CANDIDATE_DOC_FIELDS = [
  { key: "resume", title: "Resume/CV" },
  { key: "photo", title: "Photograph" },
  { key: "passport", title: "Passport" },
  { key: "cdc", title: "CDC" },
  { key: "indos", title: "INDOS" },
  { key: "visa", title: "Visa" },
  { key: "aadhar", title: "Aadhar Card" },
  { key: "pan", title: "PAN Card" },
  { key: "seamanBook", title: "Seaman Book" },
  { key: "medicalCertificate", title: "Medical Certificate" },
];

export function buildCandidateDocumentSections(documents, iconMap = {}) {
  return CANDIDATE_DOC_FIELDS.map(({ key, title }) => {
    const normalized = normalizeDocSection(documents?.[key]);
    if (!normalized) return null;
    return {
      key,
      title,
      icon: iconMap[key] ?? null,
      documents: normalized,
    };
  }).filter(Boolean);
}

export function buildVesselOwnerDocumentSections(entity, iconMap = {}) {
  const fields = [
    { key: "company_logo", title: "Company Logo", doc: entity?.company_logo },
    { key: "contract", title: "Contract", doc: entity?.contract },
    { key: "license", title: "License", doc: entity?.license },
  ];
  return fields
    .map(({ key, title, doc }) => {
      const normalized = normalizeDocSection(doc);
      if (!normalized) return null;
      return {
        key,
        title,
        icon: iconMap[key] ?? null,
        documents: normalized,
      };
    })
    .filter(Boolean);
}

export function buildVesselDocumentSections(entity, iconMap = {}) {
  const fields = [
    { key: "vessel_image", title: "Vessel Image", doc: entity?.vessel_image },
    {
      key: "vessel_documents",
      title: "Vessel Documents",
      doc: entity?.vessel_documents,
    },
  ];
  return fields
    .map(({ key, title, doc }) => {
      const normalized = normalizeDocSection(doc);
      if (!normalized) return null;
      return {
        key,
        title,
        icon: iconMap[key] ?? null,
        documents: normalized,
      };
    })
    .filter(Boolean);
}
