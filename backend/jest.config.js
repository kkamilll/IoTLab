export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".js"],
  transform: {
    "^.+\\.js$": "babel-jest"
  },
  verbose: true
};
