/**
 * Tests for geocoding service
 */

import {
  geocodeLocation,
  geocodeLocations,
  clearGeocodingCache,
  getGeocodingCacheSize,
  validateIsraelCoordinates,
} from "../../lib/services/geocoding";

describe("geocoding service", () => {
  beforeEach(() => {
    clearGeocodingCache();
  });

  describe("geocodeLocation", () => {
    it("should geocode major Israeli cities from lookup table", async () => {
      const jerusalem = await geocodeLocation("ירושלים");
      expect(jerusalem).not.toBeNull();
      expect(jerusalem?.latitude).toBeCloseTo(31.7683, 2);
      expect(jerusalem?.longitude).toBeCloseTo(35.2137, 2);

      const telAviv = await geocodeLocation("תל אביב");
      expect(telAviv).not.toBeNull();
      expect(telAviv?.latitude).toBeCloseTo(32.0853, 2);
      expect(telAviv?.longitude).toBeCloseTo(34.7818, 2);
    });

    it("should geocode October 7th affected locations", async () => {
      const kfarAza = await geocodeLocation("כפר עזה");
      expect(kfarAza).not.toBeNull();
      expect(kfarAza?.latitude).toBeCloseTo(31.4433, 2);
      expect(kfarAza?.longitude).toBeCloseTo(34.4758, 2);

      const sderot = await geocodeLocation("שדרות");
      expect(sderot).not.toBeNull();
      expect(sderot?.latitude).toBeCloseTo(31.5244, 2);
      expect(sderot?.longitude).toBeCloseTo(34.5964, 2);
    });

    it("should handle city name normalization", async () => {
      const result1 = await geocodeLocation("  ירושלים  ");
      const result2 = await geocodeLocation("ירושלים");

      expect(result1).toEqual(result2);
    });

    it("should return null for invalid input", async () => {
      expect(await geocodeLocation("")).toBeNull();
      expect(await geocodeLocation("   ")).toBeNull();
      // @ts-expect-error Testing invalid input
      expect(await geocodeLocation(null)).toBeNull();
      // @ts-expect-error Testing invalid input
      expect(await geocodeLocation(undefined)).toBeNull();
    });

    it("should return null for unknown location", async () => {
      const result = await geocodeLocation("עיר דמיונית שלא קיימת");
      expect(result).toBeNull();
    });

    it("should use cache for repeated lookups", async () => {
      clearGeocodingCache();
      expect(getGeocodingCacheSize()).toBe(0);

      await geocodeLocation("ירושלים");
      expect(getGeocodingCacheSize()).toBe(1);

      await geocodeLocation("ירושלים");
      expect(getGeocodingCacheSize()).toBe(1); // Should not increase
    });
  });

  describe("geocodeLocations", () => {
    it("should geocode multiple locations", async () => {
      const cities = ["ירושלים", "תל אביב", "חיפה"];
      const results = await geocodeLocations(cities, 10); // Use short delay for tests

      expect(results.size).toBe(3);
      expect(results.get("ירושלים")).not.toBeNull();
      expect(results.get("תל אביב")).not.toBeNull();
      expect(results.get("חיפה")).not.toBeNull();
    });

    it("should handle mix of valid and invalid locations", async () => {
      const cities = ["ירושלים", "עיר לא קיימת"];
      const results = await geocodeLocations(cities, 10);

      expect(results.size).toBe(2);
      expect(results.get("ירושלים")).not.toBeNull();
      expect(results.get("עיר לא קיימת")).toBeNull();
    });
  });

  describe("validateIsraelCoordinates", () => {
    it("should validate coordinates within Israel bounds", () => {
      // Jerusalem
      expect(validateIsraelCoordinates(31.7683, 35.2137)).toBe(true);

      // Tel Aviv
      expect(validateIsraelCoordinates(32.0853, 34.7818)).toBe(true);

      // Eilat (southern border)
      expect(validateIsraelCoordinates(29.5569, 34.9517)).toBe(true);
    });

    it("should reject coordinates outside Israel bounds", () => {
      // Too far north (Lebanon)
      expect(validateIsraelCoordinates(34.0, 35.5)).toBe(false);

      // Too far south (Egypt)
      expect(validateIsraelCoordinates(29.0, 34.5)).toBe(false);

      // Too far west (Mediterranean)
      expect(validateIsraelCoordinates(32.0, 33.0)).toBe(false);

      // Too far east (Jordan)
      expect(validateIsraelCoordinates(32.0, 36.5)).toBe(false);
    });
  });

  describe("cache management", () => {
    it("should clear cache", async () => {
      await geocodeLocation("ירושלים");
      expect(getGeocodingCacheSize()).toBeGreaterThan(0);

      clearGeocodingCache();
      expect(getGeocodingCacheSize()).toBe(0);
    });

    it("should track cache size correctly", async () => {
      clearGeocodingCache();

      await geocodeLocation("ירושלים");
      expect(getGeocodingCacheSize()).toBe(1);

      await geocodeLocation("תל אביב");
      expect(getGeocodingCacheSize()).toBe(2);

      await geocodeLocation("חיפה");
      expect(getGeocodingCacheSize()).toBe(3);
    });
  });
});
