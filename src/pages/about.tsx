import * as React from "react";
import Layout from "../components/layout";
import { Helmet } from "react-helmet";

const About: React.FunctionComponent = () => {
  return (
    <Layout isMainPage={false}>
      <Helmet>
        <script async defer src="https://buttons.github.io/buttons.js"></script>
      </Helmet>
      <div className="mx-auto my-4 container flex flex-col justify-start w-screen">
        <p className="text-black my-2 px-4 font-semibold">
          We build web apps and sites that are easy and no cost to maintain
        </p>
        <p className="text-black my-2 px-4 font-semibold bg-gray">
          We use open-source technologies like React, Node, Gatsby, and many
          others
        </p>
        <p className="text-black my-2 px-4 font-semibold">
          We open our apps and sites as open-source projects that anyone can
          run, modify, or extend.
        </p>
        <div className="my-2 px-4 flex flex-col justify-center text-orange text-xl font-bold text-center">
          You can fork this site as well.
          <a
            className="github-button"
            href="https://github.com/freereact/codebg/fork"
            data-color-scheme="no-preference: dark; light: dark; dark: dark;"
            data-size="large"
            aria-label="Fork freereact/codebg on GitHub"
          >
            Fork Me
          </a>
        </div>
        <p className="text-black my-2 px-4 font-semibold bg-gray">
          We tailor our apps and site to the hosting providers with low-cost or
          free plans (Netlify, Gatsby, AWS)
        </p>
      </div>
    </Layout>
  );
};

export default About;
