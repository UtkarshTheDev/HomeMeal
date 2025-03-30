# UI Components and Icons in HomeMeal App

This document outlines the UI components and icon libraries used in the HomeMeal app.

## Icon Libraries

### Lucide Icons

The HomeMeal app uses Lucide icons for a modern, consistent UI experience.

#### Setup

1. Install the required package:

```bash
npm install lucide-react-native
```

2. Import and use icons in your components:

```typescript
import { User, Heart, Home, Settings } from "lucide-react-native";

// Example usage
<User size={24} color="#A0AEC0" />
<Heart size={24} color="#FF6B00" />
```

#### Benefits of Lucide Icons

- **Modern Design**: Clean, consistent design language
- **Customizable**: Easy to change size, color, and other properties
- **Comprehensive**: Large selection of icons for various use cases
- **Lightweight**: Optimized for performance
- **TypeScript Support**: Full TypeScript support with proper types

#### Common Icons Used in HomeMeal

| Icon Name       | Description     | Usage                          |
| --------------- | --------------- | ------------------------------ |
| `User`          | User profile    | Profile screens, user avatars  |
| `MapPin`        | Location marker | Address selection, map screens |
| `ShoppingBag`   | Orders          | Order history, current orders  |
| `Heart`         | Favorites       | Favorite meals, chefs          |
| `Home`          | Home            | Navigation tab                 |
| `Search`        | Search          | Search functionality           |
| `MessageSquare` | Messages        | Chat functionality             |
| `Bell`          | Notifications   | Notification center            |
| `Settings`      | Settings        | App settings                   |
| `Sparkles`      | Animations      | Visual effects in headers      |
| `Camera`        | Image Capture   | Profile image selection        |
| `Phone`         | Phone Number    | Contact information            |

### Expo Vector Icons

In addition to Lucide icons, the app also uses Expo Vector Icons in some places:

```typescript
import { FontAwesome } from "@expo/vector-icons";

// Example usage
<FontAwesome name="star" size={24} color="#FFD700" />;
```

## UI Components

### Buttons

The app uses custom button components with gradient backgrounds for primary actions:

```typescript
<TouchableOpacity onPress={onPress} style={buttonStyles}>
  <LinearGradient
    colors={["#FFAD00", "#FF6B00"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
      {buttonText}
    </Text>
  </LinearGradient>
</TouchableOpacity>
```

### Fixed Bottom Buttons

For important action buttons, we use a fixed position at the bottom of the screen:

```typescript
<View
  style={{
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  }}
>
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <LinearGradient
      colors={["#FFAD00", "#FF6B00"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
        {buttonText}
      </Text>
    </LinearGradient>
  </TouchableOpacity>
</View>
```

### Cards

Cards are used throughout the app to display grouped information:

```typescript
<View
  style={{
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  }}
>
  {/* Card content */}
</View>
```

### Headers with Gradients

The app uses gradient headers for visual appeal:

```typescript
<View
  style={{
    height: height * 0.28,
    overflow: "hidden",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  }}
>
  <LinearGradient
    colors={["#FF8A00", "#FF6B00", "#FF5400"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      width: "100%",
      height: "100%",
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "android" ? 40 : 50,
      paddingBottom: 20,
      justifyContent: "flex-end",
    }}
  >
    {/* Header content */}
    <Text style={{ fontSize: 28, fontWeight: "bold", color: "#FFFFFF" }}>
      {headerTitle}
    </Text>
  </LinearGradient>
</View>
```

### Inputs

Text inputs follow a consistent style:

```typescript
<View style={{ marginBottom: 16 }}>
  <Text style={{ fontSize: 14, color: "#4A5568", marginBottom: 8 }}>
    {labelText}
  </Text>
  <TextInput
    style={{
      backgroundColor: "#F8FAFC",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      fontSize: 16,
    }}
    placeholder={placeholderText}
    value={value}
    onChangeText={onChangeText}
  />
</View>
```

### Proper Scrolling Layout

To ensure content doesn't go behind headers, we use this structure:

```typescript
<SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
  <StatusBar style="light" />
  <View style={{ flex: 1 }}>
    {/* Fixed Header */}
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={["#FF8A00", "#FF6B00", "#FF5400"]}
        {...gradientProps}
      >
        {/* Header content */}
      </LinearGradient>
    </View>

    {/* Scrollable Content */}
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Page content */}
    </ScrollView>

    {/* Fixed Bottom Button */}
    <View style={styles.bottomButtonContainer}>{/* Button content */}</View>
  </View>
</SafeAreaView>
```

## Animation

The app uses React Native Reanimated for smooth animations:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";

// Button press animation example
const buttonScale = useSharedValue(1);

const buttonAnimatedStyle = useAnimatedStyle(() => {
  return {
    transform: [{ scale: buttonScale.value }],
  };
});

const handlePress = () => {
  buttonScale.value = withSequence(
    withTiming(0.95, { duration: 100 }),
    withTiming(1, { duration: 100 })
  );

  // Other logic
};

// Usage
<Animated.View style={[styles.button, buttonAnimatedStyle]}>
  <TouchableOpacity onPress={handlePress}>
    {/* Button content */}
  </TouchableOpacity>
</Animated.View>;
```

### Sparkle Animations

For visual delight, we use animated sparkle elements:

```typescript
// Initialize animation values
const sparkle1 = useSharedValue(0);
const sparkle2 = useSharedValue(0);
const sparkle3 = useSharedValue(0);

// Set up animations
useEffect(() => {
  // Animate sparkles with different delays for a natural effect
  sparkle1.value = withDelay(
    300,
    withRepeat(
      withSequence(
        withTiming(1, {
          duration: 700,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(0, {
          duration: 700,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      ),
      -1,
      true
    )
  );

  // Repeat for other sparkles with different timings
}, []);

// Create animated styles
const sparkle1Style = useAnimatedStyle(() => ({
  opacity: sparkle1.value * 0.7,
  transform: [{ scale: 0.5 + sparkle1.value * 0.5 }],
}));

// Use in your component
<Animated.View
  style={[{ position: "absolute", top: "20%", right: "15%" }, sparkle1Style]}
>
  <Sparkles size={24} color="rgba(255,255,255,0.8)" />
</Animated.View>;
```

## Theme Consistency

### Ensuring White Background Regardless of Theme

To maintain a consistent white background regardless of the device's theme setting:

```typescript
import { SafeAreaView, View } from "react-native";

// Force white background by explicitly setting it
const Screen = ({ children }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>{children}</View>
  </SafeAreaView>
);

// In layout files, explicitly set the background color
<View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
  <Stack screenOptions={{ headerShown: false }}>{/* Stack screens */}</Stack>
</View>;
```

## Color Scheme

The HomeMeal app uses a consistent color scheme:

| Color            | Hex Code  | Usage                                    |
| ---------------- | --------- | ---------------------------------------- |
| Primary Orange   | `#FF6B00` | Primary actions, highlights              |
| Secondary Orange | `#FFAD00` | Gradients, secondary actions             |
| Dark Text        | `#000000` | Headings, important text                 |
| Medium Text      | `#4A5568` | Body text, labels                        |
| Light Text       | `#64748B` | Subtitles, hints                         |
| Background       | `#FFFFFF` | Main background                          |
| Light Background | `#F8FAFC` | Input backgrounds, secondary backgrounds |
| Border           | `#E2E8F0` | Borders, dividers                        |

## Best Practices

1. **Consistency**: Use the same components and styles across the app
2. **Accessibility**: Ensure all UI elements are accessible
3. **Performance**: Optimize components for performance
4. **Responsiveness**: Design for different screen sizes
5. **Error Handling**: Provide clear feedback for errors
6. **Loading States**: Show loading indicators when appropriate
7. **Typography**: Use consistent font sizes and weights
8. **White Background**: Always force white background regardless of device theme
9. **Fixed Actions**: Place primary action buttons at the bottom of the screen
10. **Proper Scrolling**: Use proper layout structure to prevent content from going behind headers
11. **Visual Delight**: Add subtle animations to enhance user experience

## Future Improvements

1. Create reusable components for common UI patterns
2. Implement a theme provider for easier customization
3. Add dark mode support
4. Improve animation performance
5. Create a storybook for UI components
