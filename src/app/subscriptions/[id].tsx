import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

function SubcriptionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <Text>Subscription Details: {id}</Text>

      <Link href="/">Go Back</Link>
    </View>
  );
}

export default SubcriptionDetails;
