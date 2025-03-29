import * as Location from "expo-location";
import { supabase } from "./supabaseClient";

export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
}

export async function getCurrentLocation() {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error("Location permission not granted");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    throw error;
  }
}

export async function reverseGeocode(latitude: number, longitude: number) {
  try {
    const response = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (response && response.length > 0) {
      const location = response[0];
      return {
        address: [
          location.name,
          location.street,
          location.district,
          location.subregion,
        ]
          .filter(Boolean)
          .join(", "),
        city: location.city || location.region,
        pincode: location.postalCode,
        country: location.country,
        fullAddress: location,
      };
    }
    throw new Error("No address found for these coordinates");
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    throw error;
  }
}

export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number
) {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        location: { latitude, longitude },
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating user location:", error);
    throw error;
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
