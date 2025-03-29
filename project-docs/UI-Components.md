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

## Color Scheme

The HomeMeal app uses a consistent color scheme:

| Color            | Hex Code  | Usage                                    |
| ---------------- | --------- | ---------------------------------------- |
| Primary Orange   | `#FF6B00` | Primary actions, highlights              |
| Secondary Orange | `#FFAD00` | Gradients, secondary actions             |
| Dark Text        | `#2D3748` | Headings, important text                 |
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

## Future Improvements

1. Create reusable components for common UI patterns
2. Implement a theme provider for easier customization
3. Add dark mode support
4. Improve animation performance
5. Create a storybook for UI components
