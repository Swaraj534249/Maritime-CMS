import React from "react";
import { CrewingAgents } from "../features/crewingAgent/components/CrewingAgents";
import { Navbar } from "../features/navigation/components/Navbar";
import { Footer } from "../features/footer/Footer";

export const CrewingAgentPage = () => {
  return (
    <>
      <Navbar />
      <CrewingAgents />
      {/* <Footer/> */}
    </>
  );
};
