import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

function SubcriptionDetails() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof rawId === "string" ? rawId.trim() : "";

  useEffect(() => {
    if (!id) {
      router.replace("/(tabs)/subscriptions");
    }
  }, [id, router]);

  if (!id) return null;

  return (
    <View>
      <Text>Subscription Details: {id}</Text>

      <Link href="/">Go Back</Link>
    </View>
  );
}

export default SubcriptionDetails;
