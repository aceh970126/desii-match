// Polyfills for React Native compatibility with Supabase
import "react-native-url-polyfill/auto";

// Fix for protocol property issue in React Native
if (typeof global !== "undefined") {
  // @ts-ignore
  global.location = global.location || {
    protocol: "https:",
    hostname: "localhost",
    port: "",
    pathname: "/",
    search: "",
    hash: "",
    host: "localhost",
    origin: "https://localhost",
    href: "https://localhost/",
  };
}
