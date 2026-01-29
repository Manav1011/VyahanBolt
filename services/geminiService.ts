import { GoogleGenAI } from "@google/genai";
import { Parcel, Office } from '../types';

const getClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateLogisticsInsight = async (parcels: Parcel[], offices: Office[]) => {
  const client = getClient();
  if (!client) throw new Error("API Key not found");

    const dataSummary = {
      totalParcels: parcels.length,
      offices: offices.map(o => o.name),
      parcels: parcels.map(p => ({
        status: p.currentStatus,
        route: `${p.sourceOfficeId} -> ${p.destinationOfficeId}`,
        price: p.price
      }))
    };

  const prompt = `
    You are a helpful logistics assistant. Analyze this data:
    ${JSON.stringify(dataSummary)}

    Give me 3 very simple, plain English tips or observations for the office manager. 
    Do not use complex jargon. 
    Examples: "Most parcels are going to New York today", "Revenue looks good!", "Watch out for delays in Boston".
    
    Keep it friendly and short.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I couldn't analyze the data right now. Please try again later.";
  }
};

export const suggestParcelDescription = async (rawInput: string) => {
    const client = getClient();
    if (!client) return rawInput; 

    const prompt = `
      Make this parcel description sound clean and professional.
      Input: "${rawInput}"
      Just return the cleaned text. Nothing else.
    `;

    try {
        const response = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        return response.text?.trim() || rawInput;
    } catch (e) {
        return rawInput;
    }
}