import { Request, Response } from "express";
import { Feature } from "../models/Feature";

const getAllFeatures = async (): Promise<any> => {
  try {
    const features = await Feature.find().exec();
    return { message: "Features fetched successfully", features };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

const createFeature = async (name: string, description: string): Promise<any> => {
  try {
    const feature = new Feature({
      name,
      description,
    });
    await feature.save();
    return { message: "Feature created successfully", feature };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

const updateFeature = async (featureId: string, name: string, description: string): Promise<any> => {
  try {
    return { message: "Feature updated successfully" };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

const deleteFeature = async (featureId: string): Promise<any> => {
  try {
    return { message: "Feature deleted successfully" };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

export const featureController = {
  getAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
};
