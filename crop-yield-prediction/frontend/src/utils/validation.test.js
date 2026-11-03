import { describe, expect, it } from "vitest";
import { EMPTY_FORM, toPayload, validatePrediction } from "./validation";

const options = { districts_by_state: { Karnataka: ["Bangalore"], "Tamil Nadu": ["Salem"] } };
const valid = { Crop: "rice", "State Name": "Karnataka", "Dist Name": "Bangalore", Year: "2017", Area_ha: "100",
  Temperature_C: "25", "Humidity_%": "70", pH: "6.5", Rainfall_mm: "800", Wind_Speed_m_s: "2", Solar_Radiation_MJ_m2_day: "18" };

describe("validatePrediction", () => {
  it("accepts a valid form", () => expect(validatePrediction(valid, options)).toEqual({}));
  it("flags every empty field", () => expect(Object.keys(validatePrediction(EMPTY_FORM, options))).toHaveLength(11));
  it("rejects non-positive area", () => {
    expect(validatePrediction({ ...valid, Area_ha: "0" }, options).Area_ha).toMatch(/greater than zero/);
    expect(validatePrediction({ ...valid, Area_ha: "-3" }, options).Area_ha).toBeDefined();
  });
  it("rejects out-of-range and non-numeric values", () => {
    expect(validatePrediction({ ...valid, "Humidity_%": "120" }, options)["Humidity_%"]).toBeDefined();
    expect(validatePrediction({ ...valid, pH: "abc" }, options).pH).toMatch(/number/);
    expect(validatePrediction({ ...valid, Year: "2017.5" }, options).Year).toMatch(/whole/);
  });
  it("rejects a district from another state", () =>
    expect(validatePrediction({ ...valid, "Dist Name": "Salem" }, options)["Dist Name"]).toBeDefined());
  it("builds a numeric payload", () => expect(toPayload(valid).Area_ha).toBe(100));
});
