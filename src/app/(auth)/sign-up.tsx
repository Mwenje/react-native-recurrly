import { Link } from "expo-router";
import { Text, View } from "react-native";

function SignUp() {
  return (
    <View>
      <Text>SignUp</Text>
      <Link href="/(auth)/sign-up">Sign In</Link>
    </View>
  );
}

export default SignUp;
