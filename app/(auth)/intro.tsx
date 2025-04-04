import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import Animated, { FadeIn } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface SlideItem {
  id: string;
  image: any;
  title: string;
  description: string;
}

const slides: SlideItem[] = [
  {
    id: "1",
    image: require("@/assets/images/intro1.png"),
    title: "Fresh Home Cooked Meals",
    description: "Get delicious homemade food delivered to your doorstep",
  },
  {
    id: "2",
    image: require("@/assets/images/intro2.png"),
    title: "Plan Your Meals",
    description: "Create meal plans and get automatic daily deliveries",
  },
  {
    id: "3",
    image: require("@/assets/images/intro3.png"),
    title: "Safe & Reliable",
    description: "Verified home chefs and delivery partners at your service",
  },
];

export default function IntroScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const router = useRouter();

  const renderItem: ListRenderItem<SlideItem> = ({ item }) => (
    <View
      style={{
        width,
        alignItems: "center",
        padding: 20,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Image
        source={item.image}
        style={{ width: width * 0.8, height: width }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginTop: 30,
          textAlign: "center",
          color: "#000",
        }}
      >
        {item.title}
      </Text>
      <Text
        style={{
          fontSize: 16,
          textAlign: "center",
          marginTop: 10,
          color: "#666",
          paddingHorizontal: 20,
        }}
      >
        {item.description}
      </Text>
    </View>
  );

  const handleNext = () => {
    if (currentIndex === slides.length - 1) {
      router.push(ROUTES.AUTH_LOGIN);
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <View style={{ padding: 20, paddingBottom: 40 }}>
        {/* Dots indicator */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? "#FFAD00" : "#ddd",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: "#FF6B00",
            paddingVertical: 15,
            borderRadius: 25,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
