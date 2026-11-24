// Smoke test: xác minh logic thuần trong js/logic.js hoạt động đúng
import { describe, it, expect } from "vitest";
import {
  STORES,
  LANDMARKS,
  DEFAULT_MAP_VIEW,
  haversineMeters,
  findNearestStore,
  optimizePointsOrder,
  calculateEstimatedDuration,
  parseCoordinates,
  ROUTING_PROFILES,
  escapeHtml,
  nextStoreIdFrom,
  sanitizeStoredStores,
  computeLegs,
} from "../js/logic.js";

describe("logic.js — smoke test", () => {
  it("exports dữ liệu mẫu hợp lệ", () => {
    expect(STORES.length).toBeGreaterThanOrEqual(6);
    expect(LANDMARKS.length).toBeGreaterThan(0);
    expect(DEFAULT_MAP_VIEW.zoom).toBe(13);
    for (const s of STORES) {
      expect(s.lat).toBeGreaterThan(8);
      expect(s.lng).toBeGreaterThan(100);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("haversineMeters trả 0 cho cùng một điểm", () => {
    const p = { lat: 10.7769, lng: 106.7009 };
    expect(haversineMeters(p, p)).toBeCloseTo(0, 6);
  });

  it("haversineMeters tính đúng khoảng cách ~363m trong nội thành TP.HCM", () => {
    const a = { lat: 10.7769, lng: 106.7009 };
    const b = { lat: 10.7753, lng: 106.7038 };
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(430);
  });

  it("findNearestStore tìm đúng cửa hàng gần nhất", () => {
    const result = findNearestStore({ lat: 10.78, lng: 106.70 });
    expect(result).not.toBeNull();
    expect(result.store.name).toBe("Cửa hàng Bách Hóa Xanh - Lê Lợi");
    expect(result.distance).toBeGreaterThan(0);
  });

  it("findNearestStore trả null khi danh sách rỗng", () => {
    expect(findNearestStore({ lat: 10.78, lng: 106.7 }, [])).toBeNull();
  });

  it("optimizePointsOrder giữ nguyên điểm đầu và sắp xếp lại phần còn lại", () => {
    const pts = [
      { lat: 10.0, lng: 106.0 },
      { lat: 12.0, lng: 106.0 },
      { lat: 10.5, lng: 106.0 },
    ];
    const ordered = optimizePointsOrder(pts);
    expect(ordered[0]).toBe(pts[0]); // giữ điểm xuất phát
    expect(ordered.length).toBe(3);
    // tổng chiều dài sắp xếp lại không vượt quá tuyến đơn giản 1-2-3
    const sum = (arr) =>
      arr.slice(1).reduce((acc, p, i) => acc + haversineMeters(arr[i], p), 0);
    expect(sum(ordered)).toBeLessThanOrEqual(sum(pts) + 0.001);
  });

  it("optimizePointsOrder giữ nguyên khi ≤ 2 điểm", () => {
    const pts = [{ lat: 10, lng: 106 }, { lat: 11, lng: 106 }];
    expect(optimizePointsOrder(pts)).toBe(pts);
  });

  it("calculateEstimatedDuration quy đổi theo phương tiện", () => {
    expect(calculateEstimatedDuration(1000, "walking")).toBe(800); // 1000 / 1.25
    expect(calculateEstimatedDuration(1000, "bike")).toBe(240); // 1000 / 4.17 ≈ 240
    expect(calculateEstimatedDuration(1000, "driving")).toBeNull(); // dùng OSRM
  });

  it("parseCoordinates chấp nhận tọa độ hợp lệ và từ chối sai", () => {
    expect(parseCoordinates("10.7769, 106.7009")).toEqual({ lat: 10.7769, lng: 106.7009 });
    expect(parseCoordinates("10.7769 106.7009")).toEqual({ lat: 10.7769, lng: 106.7009 });
    expect(parseCoordinates("abc")).toBeNull();
    expect(parseCoordinates("99, 106")).toBeNull(); // lat > 90
    expect(parseCoordinates("10, 999")).toBeNull(); // lng > 180
  });
});

describe("logic.js — các hàm bổ sung", () => {
  it("escapeHtml vô hiệu hoá thẻ HTML và dấu nháy", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(123)).toBe("123");
  });

  it("nextStoreIdFrom trả max id + 1", () => {
    expect(nextStoreIdFrom([])).toBe(1);
    expect(nextStoreIdFrom(STORES)).toBe(7);
    expect(nextStoreIdFrom([{ id: 3 }, { id: 10 }])).toBe(11);
  });

  it("sanitizeStoredStores loại dữ liệu sai và ép isDefault=false", () => {
    const raw = [
      { id: 7, name: "  Cửa hàng A ", lat: 10.7, lng: 106.7, isDefault: true },
      { id: 8, name: "", lat: 10.7, lng: 106.7 }, // tên rỗng
      { id: 9, name: "Sai toạ độ", lat: 200, lng: 106.7 }, // lat ngoài phạm vi
      { id: "x", name: "Sai id", lat: 10, lng: 106 }, // id không phải số
      null,
      "abc",
    ];
    const out = sanitizeStoredStores(raw);
    expect(out).toEqual([{ id: 7, name: "Cửa hàng A", lat: 10.7, lng: 106.7, isDefault: false }]);
    expect(sanitizeStoredStores("không phải mảng")).toEqual([]);
    expect(sanitizeStoredStores(undefined)).toEqual([]);
  });

  it("ROUTING_PROFILES có endpoint riêng cho xe đạp và đi bộ", () => {
    expect(ROUTING_PROFILES.driving.serviceUrl).toContain("router.project-osrm.org");
    expect(ROUTING_PROFILES.bike.serviceUrl).toContain("routed-bike");
    expect(ROUTING_PROFILES.walking.serviceUrl).toContain("routed-foot");
    for (const p of Object.values(ROUTING_PROFILES)) expect(p.osrmProfile).toBe("driving");
  });
});

describe("computeLegs", () => {
  const instructions = [
    { index: 0, distance: 7800, time: 780 },
    { index: 2, distance: 0, time: 0 }, // đến điểm trung gian
    { index: 4, distance: 4500, time: 450 },
    { index: 6, distance: 0, time: 0 }, // đến đích
  ];
  it("tách đúng quãng đường / thời gian cho từng chặng", () => {
    const legs = computeLegs(instructions, [0, 2, 6]);
    expect(legs).toEqual([
      { distance: 7800, time: 780 },
      { distance: 4500, time: 450 },
    ]);
  });
  it("dùng summary khi thiếu chỉ số điểm dừng", () => {
    expect(computeLegs([], undefined, { totalDistance: 1000, totalTime: 100 })).toEqual([
      { distance: 1000, time: 100 },
    ]);
    expect(computeLegs([], [])).toEqual([]);
  });
});
