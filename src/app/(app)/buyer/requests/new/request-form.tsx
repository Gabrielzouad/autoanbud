// src/app/(app)/buyer/requests/new/request-form.tsx
'use client';

import * as React from "react";
import { useFormStatus } from "react-dom";
import { X, Car, Search, Camera, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RequestFormProps = {
  action: (formData: FormData) => void;
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  const label = pending
    ? "Sender..."
    : disabled
      ? "Laster opp bilder..."
      : "Opprett forespørsel";

  return (
    <Button
      type="submit"
      className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[150px]"
      disabled={pending || disabled}
    >
      {label}
    </Button>
  );
}

type UploadedImage = {
  id: string;
  name: string;
  previewUrl: string;
  url?: string;
  status: "uploading" | "ready" | "error";
  error?: string;
};

export function RequestForm({ action }: RequestFormProps) {
  const [images, setImages] = React.useState<UploadedImage[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const readyImageUrls = React.useMemo(
    () =>
      images
        .filter((img) => img.status === "ready" && img.url)
        .map((img) => img.url as string),
    [images],
  );
  const isUploading = images.some((img) => img.status === "uploading");

  const uploadFile = React.useCallback(async (file: File, id: string) => {
    const requestData = new FormData();
    requestData.append("file", file);

    try {
      const response = await fetch("/api/uploads/request-images", {
        method: "POST",
        body: requestData,
      });

      const parsed = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(parsed?.error ?? "Upload feilet");
      }

      const uploadUrl = parsed?.uploads?.[0]?.url as string | undefined;
      if (!uploadUrl) {
        throw new Error("Mangler URL fra opplasting");
      }

      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, url: uploadUrl, status: "ready" } : img,
        ),
      );
      setUploadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ukjent feil ved opplasting";

      setUploadError(message);
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, status: "error", error: message } : img,
        ),
      );
    }
  }, []);

  const stageFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;

    Array.from(fileList).forEach((file) => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);

      setImages((prev) => [
        ...prev,
        { id, name: file.name, previewUrl, status: "uploading" },
      ]);

      uploadFile(file, id);
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    stageFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="specific" className="w-full">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold font-serif text-stone-900">
              Hva ser du etter?
            </h2>
            <p className="text-sm text-stone-500">
              Velg om du vil beskrive en spesifikk modell eller mer generelle
              behov.
            </p>
          </div>
          <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-stone-100">
            <TabsTrigger
              value="specific"
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm"
            >
              <Car className="mr-2 h-4 w-4" />
              Spesifikk modell
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm"
            >
              <Search className="mr-2 h-4 w-4" />
              Generelt søk
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          {/* IMPORTANT: use server action from props */}
          <form className="space-y-8" action={action}>
            <input
              type="hidden"
              name="imageUrls"
              value={JSON.stringify(readyImageUrls)}
            />
            {/* Title + Location */}
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Overskrift</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="f.eks. Familie-SUV med god plass"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationCity">Sted / område</Label>
                    <Input
                      id="locationCity"
                      name="locationCity"
                      placeholder="f.eks. Oslo, Viken"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Details Section */}
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-6 space-y-6">
                <TabsContent value="specific" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="make">Merke</Label>
                      <Input
                        id="make"
                        name="make"
                        placeholder="f.eks. Volvo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modell</Label>
                      <Input
                        id="model"
                        name="model"
                        placeholder="f.eks. XC90"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trim">Variant (valgfritt)</Label>
                      <Input
                        id="trim"
                        name="variant"
                        placeholder="f.eks. T8 Inscription"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year-from">Årsmodell (fra / til)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="year-from"
                          name="yearFrom"
                          placeholder="Fra"
                          type="number"
                        />
                        <span className="text-stone-400">-</span>
                        <Input
                          id="year-to"
                          name="yearTo"
                          placeholder="Til"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="general" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="body-type">Karosseritype</Label>
                      <Input
                        id="body-type"
                        name="bodyType"
                        placeholder="f.eks. SUV, stasjonsvogn"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuel">Drivlinje</Label>
                      <Input
                        id="fuel"
                        name="fuelType"
                        placeholder="f.eks. Elektrisk, hybrid, diesel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seats">Min. seter</Label>
                      <Input
                        id="seats"
                        name="minSeats"
                        type="number"
                        placeholder="f.eks. 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gen-year">Årsmodell (fra / til)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="gen-year-from"
                          name="generalYearFrom"
                          placeholder="Fra"
                          type="number"
                        />
                        <span className="text-stone-400">-</span>
                        <Input
                          id="gen-year-to"
                          name="generalYearTo"
                          placeholder="Til"
                          type="number"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Maks budsjett (NOK)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-stone-500">
                        kr
                      </span>
                      <Input
                        id="budget"
                        name="budgetMax"
                        className="pl-8"
                        placeholder="f.eks. 650000"
                        type="number"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Maks kilometerstand (km)</Label>
                    <Input
                      id="mileage"
                      name="maxKm"
                      placeholder="f.eks. 100000"
                      type="number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Beskrivelse og preferanser
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Beskriv behovene dine... f.eks. Må ha hengerfeste, vinterhjul inkludert, foretrekker mørke farger."
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium font-serif text-stone-900">
                    Referansebilder
                  </h3>
                  <p className="text-sm text-stone-500">
                    Last opp bilder av biler du liker, så forstår forhandlere
                    stilen din bedre.
                  </p>
                </div>
                <Badge variant="outline" className="bg-stone-50">
                  Valgfritt
                </Badge>
              </div>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
                  ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50/50"
                      : "border-stone-200 hover:border-stone-300 bg-stone-50/50"
                  }
                `}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Camera className="h-6 w-6 text-stone-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-stone-900">
                      Klikk for å laste opp eller dra filer hit
                    </p>
                    <p className="text-xs text-stone-500">
                      JPG eller PNG (maks 5MB per fil)
                    </p>
                  </div>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(event) => stageFiles(event.target.files)}
                    accept="image/*"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Velg filer
                  </Button>
                </div>
              </div>

              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-video rounded-lg overflow-hidden border border-stone-200 bg-stone-100"
                    >
                      <img
                        src={image.previewUrl || "/placeholder.svg"}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-end">
                        <div className="w-full flex items-center justify-between px-2 py-1 bg-gradient-to-t from-black/60 to-transparent text-white text-xs">
                          <span className="truncate max-w-[70%]">
                            {image.name}
                          </span>
                          {image.status === "uploading" && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          {image.status === "error" && (
                            <span className="text-red-200">Feil</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Options */}
            <Card className="border-stone-200 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="trade-in"
                      name="hasTradeIn"
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="trade-in" className="font-medium">
                        Jeg har bil å bytte inn
                      </Label>
                      <p className="text-sm text-stone-500">
                        Forhandlere kan gi deg innbyttepris på bilen du har i
                        dag.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="financing"
                      name="needsFinancing"
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="financing" className="font-medium">
                        Jeg trenger finansiering
                      </Label>
                      <p className="text-sm text-stone-500">
                        Få tilbud som inkluderer finansieringsløsninger.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4 pt-4">
              <Button variant="outline" type="button">
                Avbryt
              </Button>
              <SubmitButton disabled={isUploading} />
            </div>
          </form>
        </div>
      </Tabs>
    </div>
  );
}
