function getVariant() {
  const value = process.env.APP_VARIANT;
  return value === "preview" || value === "production" ? value : "development";
}

/** @param {import('expo/config').ConfigContext} context */
module.exports = ({ config }) => {
  const variant = getVariant();
  const suffix = variant === "production" ? "" : `.${variant === "preview" ? "preview" : "dev"}`;
  const displaySuffix = variant === "production" ? "" : variant === "preview" ? " Preview" : " Dev";

  return {
    ...config,
    name: `NCT Navigator${displaySuffix}`,
    owner: "bahroms-team",
    slug: "nct-navigator-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "nctnavigator",
    userInterfaceStyle: "automatic",
    ios: {
      bundleIdentifier: `com.nctnavigator.mobile${suffix}`,
      icon: "./assets/expo.icon",
      supportsTablet: true,
    },
    android: {
      package: `com.nctnavigator.mobile${suffix}`,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
    },
    plugins: [
      "expo-router",
      ["expo-splash-screen", { backgroundColor: "#F4F7FB", image: "./assets/images/splash-icon.png", imageWidth: 76 }],
    ],
    experiments: { typedRoutes: true },
    extra: {
      ...config.extra,
      eas: {
        projectId: "80568726-0f6c-49fc-9eaa-5243b1b173b8",
      },
    },
  };
};
