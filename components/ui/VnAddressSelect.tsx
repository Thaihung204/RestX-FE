"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Col, Form, Input, Row, Select } from "antd";
import type { FormInstance } from "antd";
import { useTranslation } from "react-i18next";

type VnProvince = { code: number; name: string };
type VnDistrict = { code: number; name: string };
type VnWard = { code: number; name: string };

type FieldName = string;

interface VnAddressSelectProps {
  form: FormInstance;
  cityFieldName: FieldName;
  districtWardFieldName: FieldName;
  stateProvinceFieldName?: FieldName;
  countryFieldName?: FieldName;
  countryValue?: string;
  cityLabel?: React.ReactNode;
  districtLabel?: React.ReactNode;
  wardLabel?: React.ReactNode;
  cityPlaceholder?: string;
  districtPlaceholder?: string;
  wardPlaceholder?: string;
  required?: boolean;
  cityRequiredMessage?: string;
  districtRequiredMessage?: string;
  wardRequiredMessage?: string;
  hideMappedFields?: boolean;
}

let provincesCache: VnProvince[] | null = null;
const districtsCache = new Map<number, VnDistrict[]>();
const wardsCache = new Map<number, VnWard[]>();

export default function VnAddressSelect({
  form,
  cityFieldName,
  districtWardFieldName,
  stateProvinceFieldName,
  countryFieldName,
  countryValue = "Việt Nam",
  cityLabel,
  districtLabel,
  wardLabel,
  cityPlaceholder,
  districtPlaceholder,
  wardPlaceholder,
  required = false,
  cityRequiredMessage,
  districtRequiredMessage,
  wardRequiredMessage,
  hideMappedFields = true,
}: VnAddressSelectProps) {
  const { t } = useTranslation();

  const resolvedCityLabel = cityLabel ?? t("address.vn.city", { defaultValue: "Tỉnh/Thành phố" });
  const resolvedDistrictLabel = districtLabel ?? t("address.vn.district", { defaultValue: "Quận/Huyện" });
  const resolvedWardLabel = wardLabel ?? t("address.vn.ward", { defaultValue: "Phường/Xã" });

  const resolvedCityPlaceholder = cityPlaceholder ?? t("address.vn.city_placeholder", { defaultValue: "Chọn tỉnh/thành phố" });
  const resolvedDistrictPlaceholder = districtPlaceholder ?? t("address.vn.district_placeholder", { defaultValue: "Chọn quận/huyện" });
  const resolvedWardPlaceholder = wardPlaceholder ?? t("address.vn.ward_placeholder", { defaultValue: "Chọn phường/xã" });

  const cityRules = required
    ? [{ required: true, message: cityRequiredMessage ?? t("address.vn.city_required", { defaultValue: "Vui lòng chọn tỉnh/thành phố" }) }]
    : [];
  const districtRules = required
    ? [{ required: true, message: districtRequiredMessage ?? t("address.vn.district_required", { defaultValue: "Vui lòng chọn quận/huyện" }) }]
    : [];
  const wardRules = required
    ? [{ required: true, message: wardRequiredMessage ?? t("address.vn.ward_required", { defaultValue: "Vui lòng chọn phường/xã" }) }]
    : [];
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);
  const [wardCode, setWardCode] = useState<number | null>(null);
  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [districts, setDistricts] = useState<VnDistrict[]>([]);
  const [wards, setWards] = useState<VnWard[]>([]);
  const [loading, setLoading] = useState(false);

  const cityValue = Form.useWatch(cityFieldName, form);
  const districtWardValue = Form.useWatch(districtWardFieldName, form);

  useEffect(() => {
    const loadProvinces = async () => {
      if (provincesCache) {
        setProvinces(provincesCache);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = (await res.json()) as VnProvince[];
        const next = Array.isArray(data) ? data : [];
        provincesCache = next;
        setProvinces(next);
      } catch {
        setProvinces([]);
      } finally {
        setLoading(false);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!provinces.length) return;
    if (!cityValue) return;

    const provinceName = String(cityValue).trim().toLowerCase();
    const matchedProvince = provinces.find(
      (p) => p.name.toLowerCase() === provinceName,
    );
    if (!matchedProvince) return;

    setProvinceCode(matchedProvince.code);

    const prefillDistricts = async () => {
      let nextDistricts = districtsCache.get(matchedProvince.code) || [];
      if (!nextDistricts.length) {
        try {
          const distRes = await fetch(
            `https://provinces.open-api.vn/api/p/${matchedProvince.code}?depth=2`,
          );
          const distData = (await distRes.json()) as { districts?: VnDistrict[] };
          nextDistricts = Array.isArray(distData?.districts)
            ? distData.districts
            : [];
          districtsCache.set(matchedProvince.code, nextDistricts);
        } catch {
          nextDistricts = [];
        }
      }
      setDistricts(nextDistricts);

      const districtRaw = String(districtWardValue || "");
      const districtName = districtRaw.includes(",")
        ? districtRaw.split(",").slice(-1)[0].trim()
        : districtRaw.trim();
      const matchedDistrict = nextDistricts.find(
        (d) => d.name.toLowerCase() === districtName.toLowerCase(),
      );
      if (!matchedDistrict) return;

      setDistrictCode(matchedDistrict.code);

      let nextWards = wardsCache.get(matchedDistrict.code) || [];
      if (!nextWards.length) {
        try {
          const wardRes = await fetch(
            `https://provinces.open-api.vn/api/d/${matchedDistrict.code}?depth=2`,
          );
          const wardData = (await wardRes.json()) as { wards?: VnWard[] };
          nextWards = Array.isArray(wardData?.wards) ? wardData.wards : [];
          wardsCache.set(matchedDistrict.code, nextWards);
        } catch {
          nextWards = [];
        }
      }
      setWards(nextWards);

      const wardName = districtRaw.includes(",")
        ? districtRaw.split(",")[0].trim()
        : "";
      if (!wardName) return;

      const matchedWard = nextWards.find(
        (w) => w.name.toLowerCase() === wardName.toLowerCase(),
      );
      if (matchedWard) setWardCode(matchedWard.code);
    };

    prefillDistricts();
  }, [provinces, cityValue, districtWardValue]);

  const provinceOptions = useMemo(
    () => provinces.map((p) => ({ label: p.name, value: p.code })),
    [provinces],
  );
  const districtOptions = useMemo(
    () => districts.map((d) => ({ label: d.name, value: d.code })),
    [districts],
  );
  const wardOptions = useMemo(
    () => wards.map((w) => ({ label: w.name, value: w.code })),
    [wards],
  );

  const handleProvinceChange = async (code: number) => {
    setProvinceCode(code);
    setDistrictCode(null);
    setWardCode(null);
    setDistricts([]);
    setWards([]);

    const selected = provinces.find((p) => p.code === code);
    form.setFieldsValue({
      [cityFieldName]: selected?.name || "",
      [districtWardFieldName]: "",
      ...(stateProvinceFieldName ? { [stateProvinceFieldName]: countryValue } : {}),
      ...(countryFieldName ? { [countryFieldName]: countryValue } : {}),
    });

    const cachedDistricts = districtsCache.get(code);
    if (cachedDistricts) {
      setDistricts(cachedDistricts);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
      const data = (await res.json()) as { districts?: VnDistrict[] };
      const nextDistricts = Array.isArray(data?.districts) ? data.districts : [];
      districtsCache.set(code, nextDistricts);
      setDistricts(nextDistricts);
    } catch {
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictChange = async (code: number) => {
    setDistrictCode(code);
    setWardCode(null);
    setWards([]);

    const selected = districts.find((d) => d.code === code);
    form.setFieldsValue({ [districtWardFieldName]: selected?.name || "" });

    const cachedWards = wardsCache.get(code);
    if (cachedWards) {
      setWards(cachedWards);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
      const data = (await res.json()) as { wards?: VnWard[] };
      const nextWards = Array.isArray(data?.wards) ? data.wards : [];
      wardsCache.set(code, nextWards);
      setWards(nextWards);
    } catch {
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWardChange = (code: number) => {
    setWardCode(code);
    const selected = wards.find((w) => w.code === code);
    const districtName = districts.find((d) => d.code === districtCode)?.name || "";
    form.setFieldsValue({
      [districtWardFieldName]: selected
        ? `${selected.name}, ${districtName}`
        : districtName,
    });
  };

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item label={resolvedCityLabel} rules={cityRules}>
            <Select
              loading={loading}
              placeholder={resolvedCityPlaceholder}
              value={provinceCode ?? undefined}
              onChange={handleProvinceChange}
              options={provinceOptions}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label={resolvedDistrictLabel} rules={districtRules}>
            <Select
              loading={loading}
              placeholder={resolvedDistrictPlaceholder}
              value={districtCode ?? undefined}
              onChange={handleDistrictChange}
              disabled={!provinceCode}
              options={districtOptions}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label={resolvedWardLabel} rules={wardRules}>
            <Select
              loading={loading}
              placeholder={resolvedWardPlaceholder}
              value={wardCode ?? undefined}
              onChange={handleWardChange}
              disabled={!districtCode}
              options={wardOptions}
            />
          </Form.Item>
        </Col>
      </Row>

      {hideMappedFields && (
        <>
          <Form.Item name={cityFieldName} hidden>
            <Input />
          </Form.Item>
          <Form.Item name={districtWardFieldName} hidden>
            <Input />
          </Form.Item>
        </>
      )}
    </>
  );
}
