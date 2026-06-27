import { expect } from "chai";
import { createAsyncCache, CacheStorage } from "../src/utils/cache";

describe("createAsyncCache Tests", function () {
  this.timeout(5000);

  it("Should call factory on first get", async () => {
    let callCount = 0;
    const cache = createAsyncCache(async () => {
      callCount++;
      return "value";
    }, -1);

    const result = await cache.get();
    expect(result).to.equal("value");
    expect(callCount).to.equal(1);
  });

  it("Should return cached value without calling factory again (infinite TTL)", async () => {
    let callCount = 0;
    const cache = createAsyncCache(async () => {
      callCount++;
      return { data: 42 };
    }, -1);

    await cache.get();
    await cache.get();
    await cache.get();
    expect(callCount).to.equal(1);
  });

  it("Should return cached value within TTL window", async () => {
    let callCount = 0;
    const cache = createAsyncCache(
      async () => {
        callCount++;
        return callCount;
      },
      60_000,
    );

    const first = await cache.get();
    const second = await cache.get();
    expect(first).to.equal(1);
    expect(second).to.equal(1);
    expect(callCount).to.equal(1);
  });

  it("Should refetch after TTL expires", async () => {
    let callCount = 0;
    const cache = createAsyncCache(
      async () => {
        callCount++;
        return callCount;
      },
      50,
    );

    const first = await cache.get();
    expect(first).to.equal(1);

    await new Promise((r) => setTimeout(r, 80));

    const second = await cache.get();
    expect(second).to.equal(2);
    expect(callCount).to.equal(2);
  });

  it("Should deduplicate concurrent in-flight requests", async () => {
    let callCount = 0;
    const cache = createAsyncCache(
      async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return "shared";
      },
      60_000,
    );

    const [a, b, c] = await Promise.all([
      cache.get(),
      cache.get(),
      cache.get(),
    ]);

    expect(a).to.equal("shared");
    expect(b).to.equal("shared");
    expect(c).to.equal("shared");
    expect(callCount).to.equal(1);
  });

  it("Should propagate factory error and clear in-flight lock", async () => {
    let callCount = 0;
    const cache = createAsyncCache(
      async () => {
        callCount++;
        throw new Error("fetch failed");
      },
      60_000,
    );

    let caught: Error | undefined;
    try {
      await cache.get();
    } catch (e) {
      caught = e as Error;
    }
    expect(caught?.message).to.equal("fetch failed");

    try {
      await cache.get();
    } catch (e) {
      caught = e as Error;
    }
    expect(caught?.message).to.equal("fetch failed");
    expect(callCount).to.equal(2);
  });

  it("update() should force a refresh regardless of TTL", async () => {
    let callCount = 0;
    const cache = createAsyncCache(
      async () => {
        callCount++;
        return callCount;
      },
      -1,
    );

    const first = await cache.get();
    expect(first).to.equal(1);

    const updated = await cache.update();
    expect(updated).to.equal(2);
    expect(callCount).to.equal(2);

    const cached = await cache.get();
    expect(cached).to.equal(2);
    expect(callCount).to.equal(2);
  });
});

describe("CacheStorage Tests", function () {
  it("Should throw when limit <= 0", () => {
    expect(() => new CacheStorage(0)).to.throw(
      "Size of cache storage must be larger than 0!",
    );
    expect(() => new CacheStorage(-1)).to.throw(
      "Size of cache storage must be larger than 0!",
    );
  });

  it("Should store and retrieve values", async () => {
    const storage = new CacheStorage<string>(10);
    const result = await storage.get("key1", async () => "value1");
    expect(result).to.equal("value1");
  });

  it("Should return cached promise on cache hit (no re-fetch)", async () => {
    const storage = new CacheStorage<string>(10);
    let fetchCount = 0;
    const fetchFn = async () => {
      fetchCount++;
      return "val";
    };

    await storage.get("k", fetchFn);
    await storage.get("k", fetchFn);
    expect(fetchCount).to.equal(1);
  });

  it("Should evict oldest entry when limit exceeded (LRU)", async () => {
    const storage = new CacheStorage<string>(2);

    await storage.get("a", async () => "1");
    await storage.get("b", async () => "2");

    let fetchCount = 0;
    await storage.get("c", async () => {
      fetchCount++;
      return "3";
    });

    const reFetchCount = fetchCount;
    fetchCount = 0;

    const aAgain = await storage.get("a", async () => {
      fetchCount++;
      return "re-fetched-a";
    });

    expect(reFetchCount).to.equal(1);
    expect(fetchCount).to.be.greaterThan(0);
  });

  it("Should re-promote accessed key to most-recent (LRU reorder)", async () => {
    const storage = new CacheStorage<string>(2);

    await storage.get("a", async () => "1");
    await storage.get("b", async () => "2");

    await storage.get("a", async () => "should-not-call");

    let cCalled = false;
    await storage.get("c", async () => {
      cCalled = true;
      return "3";
    });
    expect(cCalled).to.be.true;

    let bCalled = false;
    const bVal = await storage.get("b", async () => {
      bCalled = true;
      return "re-b";
    });
    expect(bCalled).to.be.true;
  });

  it("Should delete entry when fetchFn rejects", async () => {
    const storage = new CacheStorage<string>(5);

    try {
      await storage.get("bad", async () => {
        throw new Error("fail");
      });
    } catch {}

    let called = false;
    await storage.get("bad", async () => {
      called = true;
      return "ok";
    });

    expect(called).to.be.true;
  });

  it("clear() should empty storage", async () => {
    const storage = new CacheStorage<string>(5);
    await storage.get("x", async () => "1");
    expect(storage.size).to.equal(1);

    storage.clear();
    expect(storage.size).to.equal(0);
  });

  it("size should reflect current entry count", async () => {
    const storage = new CacheStorage<string>(5);
    expect(storage.size).to.equal(0);

    await storage.get("a", async () => "1");
    expect(storage.size).to.equal(1);

    await storage.get("b", async () => "2");
    expect(storage.size).to.equal(2);
  });
});
