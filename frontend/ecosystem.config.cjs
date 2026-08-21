module.exports = {
  apps: [
    {
      name: "dat-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
