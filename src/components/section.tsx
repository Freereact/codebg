import * as React from "react";
import { Link } from "gatsby";

const Section = ({
  title,
  linkTo,
  children,
}: {
  title?: string;
  linkTo?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="container mx-auto my-2 shadow-lg px-10 py-10">
      {title && (
        <div className="px-3 py-3 font-bold text-orange text-3xl">{title}</div>
      )}
      <div>{children}</div>
      {linkTo && (
        <div className="px-3 py-3 text-blue">
          <Link to={`/${linkTo}/`}>Read More</Link>
        </div>
      )}
    </div>
  );
};

export default Section;
