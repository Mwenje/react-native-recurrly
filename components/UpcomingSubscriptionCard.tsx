import { Image, Text, View } from "react-native";
import { SvgUri } from "react-native-svg";
import { formatCurrency } from "../lib/utils";

function UpcomingSubscriptionCard({
  name,
  price,
  daysLeft,
  icon,
  currency,
}: UpcomingSubscription) {
  const remoteIconUri =
    typeof icon === "object" &&
    icon !== null &&
    !Array.isArray(icon) &&
    "uri" in icon &&
    typeof icon.uri === "string"
      ? icon.uri
      : null;
  const isRemoteSvg =
    remoteIconUri !== null &&
    remoteIconUri.split("?", 1)[0].toLowerCase().endsWith(".svg");

  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        {isRemoteSvg ? (
          <View className="upcoming-icon overflow-hidden">
            <SvgUri uri={remoteIconUri} width="100%" height="100%" />
          </View>
        ) : (
          <Image source={icon} className="upcoming-icon" />
        )}

        <View className="min-w-0 flex-1">
          <Text className="upcoming-price">
            {formatCurrency(price, currency)}
          </Text>
          <Text
            className="upcoming-meta"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {daysLeft > 1 ? `${daysLeft} days left` : "Last day"}
          </Text>
        </View>
      </View>

      <Text className="upcoming-name" numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

export default UpcomingSubscriptionCard;
