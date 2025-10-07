/**
 * Usage examples for the geocoding service
 *
 * This file demonstrates how to use the geocoding service
 * to convert Hebrew city names to coordinates.
 */

import { geocodeLocation, geocodeLocations } from "./geocoding";

/**
 * Example 1: Geocode a single location
 */
async function exampleSingleLocation() {
  console.log("Example 1: Single location geocoding");

  const cityName = "ירושלים";
  const coordinates = await geocodeLocation(cityName);

  if (coordinates) {
    console.log(`${cityName}: ${coordinates.latitude}, ${coordinates.longitude}`);
  } else {
    console.log(`Could not geocode: ${cityName}`);
  }
}

/**
 * Example 2: Geocode multiple locations
 */
async function exampleMultipleLocations() {
  console.log("\nExample 2: Multiple locations geocoding");

  const cities = ["תל אביב", "חיפה", "באר שבע", "כפר עזה", "שדרות"];

  const results = await geocodeLocations(cities);

  for (const [cityName, coordinates] of results) {
    if (coordinates) {
      console.log(`${cityName}: ${coordinates.latitude}, ${coordinates.longitude}`);
    } else {
      console.log(`${cityName}: Not found`);
    }
  }
}

/**
 * Example 3: Using with victim data
 */
async function exampleWithVictimData() {
  console.log("\nExample 3: Geocoding victim data");

  // Simulate victim data without coordinates
  const victimData = [
    { name: "חנה כהן", location: "ירושלים" },
    { name: "דוד לוי", location: "כפר עזה" },
    { name: "שרה אברהם", location: "שדרות" },
  ];

  // Geocode each location
  for (const victim of victimData) {
    const coordinates = await geocodeLocation(victim.location);
    if (coordinates) {
      console.log(
        `${victim.name} from ${victim.location}: (${coordinates.latitude}, ${coordinates.longitude})`
      );
    } else {
      console.log(`${victim.name} from ${victim.location}: Location not found`);
    }
  }
}

/**
 * Example 4: Error handling
 */
async function exampleErrorHandling() {
  console.log("\nExample 4: Error handling");

  // Try to geocode invalid inputs
  const invalidInputs = ["", "   ", "עיר שלא קיימת"];

  for (const input of invalidInputs) {
    const result = await geocodeLocation(input);
    if (result === null) {
      console.log(`Failed to geocode: "${input}"`);
    }
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  await exampleSingleLocation();
  await exampleMultipleLocations();
  await exampleWithVictimData();
  await exampleErrorHandling();
}

// Uncomment to run examples:
// runAllExamples().catch(console.error);
