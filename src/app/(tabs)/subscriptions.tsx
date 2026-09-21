import { styled } from "nativewind";
import { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { useSubscriptions } from "../../context/SubscriptionContext";

const SafeAreaView = styled(RNSafeAreaView);

function Subscriptions() {
  const { subscriptions } = useSubscriptions();
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSubscriptions = subscriptions.filter((subscription) =>
    [
      subscription.name,
      subscription.plan,
      subscription.category,
      subscription.status,
    ].some((value) => value?.toLowerCase().includes(normalizedQuery)),
  );

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text className="subscription-screen-title">Subscriptions</Text>

        <TextInput
          className="subscription-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search subscriptions"
          placeholderTextColor="rgba(0, 0, 0, 0.45)"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />

        <FlatList
          data={filteredSubscriptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() =>
                setExpandedSubscriptionId((currentId) =>
                  currentId === item.id ? null : item.id,
                )
              }
            />
          )}
          extraData={expandedSubscriptionId}
          ItemSeparatorComponent={() => <View className="h-4" />}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-30"
          ListEmptyComponent={
            <Text className="subscription-empty-state">
              No subscriptions match your search.
            </Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default Subscriptions;
