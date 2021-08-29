import * as React from "react";
import Layout from "../components/layout";

const About: React.FunctionComponent = () => {
  return (
    <Layout isMainPage={false}>
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
          run, modify, or extend
        </p>
        <p className="text-black my-2 px-4 font-semibold bg-gray">
          We tailor our apps and site to the hosting providers with low-cost or
          free plans (Netlify, Gatsby, AWS)
        </p>
      </div>
    </Layout>
  );
};

export default About;
