"use client";

import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/common/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/common/card";
import { Text } from "@/components/ui/common/text";
import { useCreateNFT, useImageUpload } from "@/services/nft/nft.hooks";
import { NFTDetails } from "@/services/nft/nft.types";
import { useWallet } from "@solana/wallet-adapter-react";

interface CreateNFTProps {
  collectionMint?: string;
  onNFTCreated?: (nft: NFTDetails) => void;
}

export function CreateNFT({ collectionMint, onNFTCreated }: CreateNFTProps) {
  const { connected } = useWallet();
  const { create, loading: creating, error: createError } = useCreateNFT();
  const { upload, loading: uploading, error: uploadError } = useImageUpload();

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    collectionMintAddress: collectionMint || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [createdNFT, setCreatedNFT] = useState<NFTDetails | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!imageFile) {
      alert("Please select an image for the NFT");
      return;
    }

    try {
      // Upload image first
      const imageUri = await upload(imageFile);
      if (!imageUri) {
        throw new Error("Failed to upload image");
      }

      // Create the NFT
      const nft = await create({
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        uri: imageUri,
        collectionMint: formData.collectionMintAddress
          ? new PublicKey(formData.collectionMintAddress)
          : undefined,
      });

      if (nft) {
        setCreatedNFT(nft);
        onNFTCreated?.(nft);

        // Reset form
        setFormData({
          name: "",
          symbol: "",
          description: "",
          collectionMintAddress: collectionMint || "",
        });
        setImageFile(null);
        setImagePreview("");
      }
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  };

  if (!connected) {
    return (
      <Card>
        <CardContent>
          <Text color="muted" align="center">
            Please connect your wallet to create an NFT
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create NFT</CardTitle>
      </CardHeader>
      <CardContent>
        {!createdNFT ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  NFT Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome NFT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="MAN"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="A unique NFT..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Collection Mint Address (Optional)
              </label>
              <input
                type="text"
                name="collectionMintAddress"
                value={formData.collectionMintAddress}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Collection mint address"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                htmlFor="image-upload"
              >
                NFT Image *
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {(createError || uploadError) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <Text color="error" variant="small">
                  {createError || uploadError}
                </Text>
              </div>
            )}

            <Button
              type="submit"
              disabled={creating || uploading}
              className="w-full"
            >
              {creating || uploading ? "Creating NFT..." : "Create NFT"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <Text color="success" weight="medium" className="mb-2">
                NFT Created Successfully!
              </Text>
              <div className="space-y-2">
                <Text variant="small">
                  <strong>Mint Address:</strong> {createdNFT.mint.toString()}
                </Text>
                <Text variant="small">
                  <strong>Name:</strong> {createdNFT.name}
                </Text>
                <Text variant="small">
                  <strong>Symbol:</strong> {createdNFT.symbol}
                </Text>
                <Text variant="small">
                  <strong>Creator:</strong> {createdNFT.creator.toString()}
                </Text>
                {createdNFT.collection && (
                  <Text variant="small">
                    <strong>Collection:</strong>{" "}
                    {createdNFT.collection.toString()}
                  </Text>
                )}
              </div>
            </div>

            <Button
              onClick={() => setCreatedNFT(null)}
              variant="outline"
              className="w-full"
            >
              Create Another NFT
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
