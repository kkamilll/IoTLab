module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.jsx?$": "babel-jest"
  },
  moduleFileExtensions: ["js", "jsx", "json"],
  setupFiles: ["<rootDir>/jest.setup.cjs"]
};
