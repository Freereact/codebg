import * as React from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col justify-evenly">{children}</div>
  );
};

export default Layout;
