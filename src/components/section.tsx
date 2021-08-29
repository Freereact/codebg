import * as React from "react";

const Section = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="container mx-auto my-2 shadow-lg px-10 py-10">
      {title && (
        <div className="px-3 py-3 font-bold text-orange text-3xl">{title}</div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Section;
