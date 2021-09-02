module.exports = {
  siteMetadata: {
    siteUrl: "https://codebg.com",
    title: "CodeBG",
  },
  plugins: [
    "gatsby-plugin-react-helmet",
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "CodeBG",
        short_name: "CodeBG",
        start_url: "/",
        background_color: "#FFFAF0",
        display: "standalone",
        theme_color: "#e06900",
        icon: "src/images/favicon.png",
      },
    },
    {
      resolve: `gatsby-plugin-typescript`,
      options: {
        isTSX: true, // defaults to false
        jsxPragma: `jsx`, // defaults to "React"
        allExtensions: true, // defaults to false
      },
    },
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        postCssPlugins: [
          require("tailwindcss"),
          require("./tailwind.config.js"),
        ],
      },
    },
  ],
};
