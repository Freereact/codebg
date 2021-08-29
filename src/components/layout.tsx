import * as React from "react";
import { Link } from "gatsby";

const Layout = ({
  children,
  isMainPage = true,
}: {
  children: React.ReactNode;
  isMainPage: boolean;
}) => {
  if (isMainPage) {
    return (
      <div className="min-h-screen flex flex-col justify-evenly">
        {children}
      </div>
    );
  } else {
    return (
      <React.Fragment>
        <div className="text-orange text-3xl font-bold shadow-lg px-10 py-5">
          <Link to="/">CodeBG</Link>
        </div>
        <div className="min-h-screen flex flex-col justify-start w-full mx-auto">
          {children}
        </div>
      </React.Fragment>
    );
  }
};

export default Layout;
