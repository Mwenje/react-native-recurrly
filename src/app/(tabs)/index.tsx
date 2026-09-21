import { posthog } from "@/config/posthog";
import "@/global.css";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import ListHeading from "../../../components/ListHeading";
import SubscriptionCard from "../../../components/SubscriptionCard";
import UpcomingSubscriptionCard from "../../../components/UpcomingSubscriptionCard";
import { HOME_BALANCE } from "../../../constants/data";
import { icons } from "../../../constants/icons";
import images from "../../../constants/images";
import { formatCurrency } from "../../../lib/utils";
import CreateSubscriptionModal from "../../components/CreateSubscriptionModal";
import { useSubscriptions } from "../../context/SubscriptionContext";

const SafeAreaView = styled(RNSafeAreaView);

function getNextRenewalDate(subscription: Subscription, now: dayjs.Dayjs) {
  if (!subscription.renewalDate) return null;

  const renewalDate = dayjs(subscription.renewalDate);
  if (!renewalDate.isValid()) return null;

  const interval = subscription.billing === "Yearly" ? "year" : "month";
  let nextRenewalDate = renewalDate;

  while (!nextRenewalDate.isAfter(now)) {
    nextRenewalDate = nextRenewalDate.add(1, interval);
  }

  return nextRenewalDate;
}

/** Renders the personalized subscription dashboard. */
export default function App() {
  const { user } = useUser();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const { subscriptions, addSubscription } = useSubscriptions();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);
  const now = dayjs();
  const upcomingSubscriptions = subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => {
      const nextRenewalDate = getNextRenewalDate(subscription, now);
      if (!nextRenewalDate) return null;

      return {
        id: subscription.id,
        icon: subscription.icon,
        name: subscription.name,
        price: subscription.price,
        currency: subscription.currency,
        daysLeft: Math.max(0, nextRenewalDate.diff(now, "day")),
        nextRenewalDate,
      };
    })
    .filter((subscription) => subscription !== null)
    .sort((first, second) => first.nextRenewalDate.diff(second.nextRenewalDate))
    .slice(0, 3);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={
                    user?.imageUrl ? { uri: user.imageUrl } : images.avatar
                  }
                  className="home-avatar"
                />
                <Text className="home-user-name">
                  {user?.fullName ||
                    user?.primaryEmailAddress?.emailAddress ||
                    "Your account"}
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Add subscription"
                accessibilityRole="button"
                className="home-add-icon"
                onPress={() => setIsCreateModalVisible(true)}
              >
                <Image source={icons.add} className="size-6" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>

              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>

                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />

              <FlatList
                data={upcomingSubscriptions}
                renderItem={({ item }) => (
                  <UpcomingSubscriptionCard {...item} />
                )}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />
            </View>

            <ListHeading title="All Subscriptions" />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              if (expandedSubscriptionId !== item.id) {
                posthog?.capture("subscription_expanded");
              }
              setExpandedSubscriptionId((currentId) =>
                currentId === item.id ? null : item.id,
              );
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions yet.</Text>
        }
        contentContainerClassName="pb-30"
      />
      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreated={addSubscription}
      />
    </SafeAreaView>
  );
}
