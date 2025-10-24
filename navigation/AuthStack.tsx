import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { CreateChildProfileScreen } from "../screens/CreateChildProfileScreen";
import { EditChildProfileScreen } from "../screens/EditChildProfileScreen";
import { FamilyDashboardScreen } from "../screens/FamilyDashboardScreen";
import { ProfileCheckScreen } from "../screens/ProfileCheckScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { Step0AccountType } from "../screens/onboarding/Step0AccountType";
import { Step1Profile } from "../screens/onboarding/Step1Profile";
import { Step2Interests } from "../screens/onboarding/Step2Interests";
import { Step3Avatar } from "../screens/onboarding/Step3Avatar";
import { Step4Preview } from "../screens/onboarding/Step4Preview";

const Stack = createStackNavigator();

interface AuthStackProps {
  initialRoute?: string;
}

export const AuthStack: React.FC<AuthStackProps> = ({
  initialRoute = "SignIn",
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ProfileCheck" component={ProfileCheckScreen} />
      <Stack.Screen name="Step0AccountType" component={Step0AccountType} />
      <Stack.Screen name="Step1Profile" component={Step1Profile} />
      <Stack.Screen name="Step2Interests" component={Step2Interests} />
      <Stack.Screen name="Step3Avatar" component={Step3Avatar} />
      <Stack.Screen name="Step4Preview" component={Step4Preview} />
      <Stack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} />
      <Stack.Screen
        name="CreateChildProfile"
        component={CreateChildProfileScreen}
      />
      <Stack.Screen
        name="EditChildProfile"
        component={EditChildProfileScreen as any}
      />
    </Stack.Navigator>
  );
};
