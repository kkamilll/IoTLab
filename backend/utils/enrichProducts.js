import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";
import { productEnrichmentData } from "./productEnrichmentData.js";

const runEnrichment = async () => {
  try {
    console.log("Łączenie z bazą danych MongoDB...");
    await connectDB();

    console.log("Aktualizowanie parametrów i opisów produktów...");
    let updatedCount = 0;

    for (const [productName, data] of Object.entries(productEnrichmentData)) {
      const result = await Product.updateMany(
        { name: productName },
        {
          $set: {
            description: data.description,
            extraFields: data.extraFields,
            labRoom: data.labRoom,
            tags: data.tags,
            isRentable: true,
            isVisible: true
          }
        }
      );

      if (result.matchedCount > 0) {
        console.log(`✓ Zaktualizowano pomyślnie: ${productName} (zmodyfikowano: ${result.modifiedCount})`);
        updatedCount++;
      } else {
        console.warn(`! Nie znaleziono w bazie produktu o nazwie: ${productName}`);
      }
    }

    console.log(`\nGotowe! Zaktualizowano ${updatedCount} produktów z bogatymi parametrami technicznymi i opisami.`);
    process.exit(0);
  } catch (error) {
    console.error("Błąd podczas aktualizacji bazy:", error);
    process.exit(1);
  }
};

runEnrichment();
