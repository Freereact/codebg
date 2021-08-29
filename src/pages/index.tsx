import * as React from "react";
import Layout from "../components/layout";
import Section from "../components/section";

const IndexPage = () => {
  return (
    <Layout>
      <Section title="CodeBG">
        <div className="text-2xl">A web development boutique</div>
      </Section>
      <Section title="About">
        <div className="text-2xl">We do web apps and sites.</div>
      </Section>
      <Section title="Contact Us">
        <div className="text-base text-blue">
          <a href="mailto:request@codebg.com">Email: request@codebg.com</a>
        </div>
      </Section>
    </Layout>
  );
};

export default IndexPage;
