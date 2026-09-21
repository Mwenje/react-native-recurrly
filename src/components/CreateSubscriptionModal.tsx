import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { resolveSubscriptionIcon } from "../../lib/subscriptionIcons";

const categories = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const categoryColors: Record<(typeof categories)[number], string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#b8e8d0",
  Productivity: "#f6c6a8",
  Cloud: "#c9d8f0",
  Music: "#f0c4d8",
  Other: "#ded8c8",
};

type Frequency = "Monthly" | "Yearly";

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (subscription: Subscription) => void;
}

function CreateSubscriptionModal({
  visible,
  onClose,
  onCreated,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("Other");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isResolvingIcon, setIsResolvingIcon] = useState(false);

  const parsedPrice = Number.parseFloat(price);
  const hasValidName = name.trim().length > 0;
  const hasValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const isValid = hasValidName && hasValidPrice;

  function resetForm() {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Other");
    setHasSubmitted(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    setHasSubmitted(true);

    if (!isValid) return;

    setIsResolvingIcon(true);

    try {
      const startDate = dayjs();
      const renewalDate = startDate
        .add(1, frequency === "Monthly" ? "month" : "year")
        .toISOString();
      const subscription: Subscription = {
        id: `${name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        icon: await resolveSubscriptionIcon(name.trim()),
        name: name.trim(),
        price: parsedPrice,
        currency: "USD",
        frequency,
        billing: frequency,
        category,
        status: "active",
        startDate: startDate.toISOString(),
        renewalDate,
        color: categoryColors[category],
      };

      onCreated(subscription);
      resetForm();
      onClose();
    } finally {
      setIsResolvingIcon(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className="modal-overlay">
        <KeyboardAvoidingView
          className="mt-auto w-full"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="modal-container w-full">
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                accessibilityLabel="Close new subscription modal"
                accessibilityRole="button"
                className="modal-close"
                onPress={handleClose}
              >
                <Text className="modal-close-text">X</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerClassName="modal-body"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className={clsx("auth-input", {
                    "auth-input-error": hasSubmitted && !hasValidName,
                  })}
                  onChangeText={setName}
                  placeholder="e.g. Netflix"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={name}
                />
                {hasSubmitted && !hasValidName ? (
                  <Text className="auth-error">Enter a subscription name.</Text>
                ) : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className={clsx("auth-input", {
                    "auth-input-error": hasSubmitted && !hasValidPrice,
                  })}
                  keyboardType="decimal-pad"
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={price}
                />
                {hasSubmitted && !hasValidPrice ? (
                  <Text className="auth-error">
                    Enter a price greater than 0.
                  </Text>
                ) : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as Frequency[]).map((option) => (
                    <Pressable
                      key={option}
                      className={clsx("picker-option", {
                        "picker-option-active": frequency === option,
                      })}
                      onPress={() => setFrequency(option)}
                    >
                      <Text
                        className={clsx("picker-option-text", {
                          "picker-option-text-active": frequency === option,
                        })}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {categories.map((option) => (
                    <Pressable
                      key={option}
                      className={clsx("category-chip", {
                        "category-chip-active": category === option,
                      })}
                      onPress={() => setCategory(option)}
                    >
                      <Text
                        className={clsx("category-chip-text", {
                          "category-chip-text-active": category === option,
                        })}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                className={clsx("auth-button", {
                  "auth-button-disabled": !isValid || isResolvingIcon,
                })}
                disabled={isResolvingIcon}
                onPress={handleSubmit}
              >
                <Text className="auth-button-text">
                  {isResolvingIcon ? "Finding icon..." : "Create subscription"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default CreateSubscriptionModal;
