import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DRIVER_FILE_FIELDS: Record<string, string> = {
  src: "srcFile",
  psychotech: "psychotechFile",
  criminalRecord: "criminalRecordFile",
  healthReport: "healthReportFile",
  license: "licenseFile",
  residenceDoc: "residenceDocFile",
};

const VEHICLE_FILE_FIELDS: Record<string, string> = {
  inspection: "inspectionFile",
  insurance: "insuranceFile",
  routePermit: "routePermitFile",
  approval: "approvalFile",
  kasko: "kaskoFile",
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const docType = formData.get("docType") as string;

    if (!file || !entityType || !entityId || !docType) {
      return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
    }

    if (!["driver", "vehicle"].includes(entityType)) {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      return NextResponse.json({ error: "Sadece PDF, JPG, PNG yüklenebilir" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dir = path.join(process.cwd(), "uploads", entityType, entityId);
    const filename = `${docType}.${ext}`;
    const filepath = path.join(dir, filename);

    await mkdir(dir, { recursive: true });
    await writeFile(filepath, buffer);

    const fileUrl = `/api/files/${entityType}/${entityId}/${filename}`;

    // DB'ye kaydet
    if (entityType === "driver") {
      const field = DRIVER_FILE_FIELDS[docType];
      if (field) {
        await prisma.driver.update({ where: { id: entityId }, data: { [field]: fileUrl } });
      }
    } else if (entityType === "vehicle") {
      const field = VEHICLE_FILE_FIELDS[docType];
      if (field) {
        await prisma.vehicle.update({ where: { id: entityId }, data: { [field]: fileUrl } });
      }
    }

    return NextResponse.json({ url: fileUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Sunucu hatası: " + (e instanceof Error ? e.message : "bilinmiyor") }, { status: 500 });
  }
}
