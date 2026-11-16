import asyncio, sys
from playwright.async_api import async_playwright
OUT=sys.argv[1]; SCHEME=sys.argv[2] if len(sys.argv)>2 else "dark"
SETUP = """
(() => {
  newGame();
  S.player.level = 9; S.coins = 5240; S.gems = 35; S.friends && (S.friends.name = S.friends.name || "");
  const pick = (el, r, i) => POOLS[el][r][i || 0];
  const add = (id, lvl, team, shard) => addMon(makeMon(id, lvl, shard), team);
  const first = Object.values(S.mons)[0]; first.level = 22; first.stage = SP[first.id].forms.length > 1 ? 1 : 0; first.name = formName(first); calc(first); first.hp = first.maxHp;
  add(pick("Water","Rare"), 21, true); add(pick("Plant","Epic"), 20, true); add(pick("Electric","Rare"), 19, true);
  add(pick("Earth","Uncommon"), 14); add(pick("Psychic","Rare"), 17); add(pick("Ghost","Uncommon"), 12); add(pick("Physical","Common"), 11);
  add(pick("Plant","Common"), 9); add(pick("Water","Common",1), 10); add(pick("Fire","Uncommon"), 13); add(pick("Plant","Rare"), 16, false, true);
  add(pick("Water","Uncommon"), 12); add(pick("Fire","Common"), 8); add(pick("Earth","Common"), 9);
  for (const w of [1, 2]) { const p = prog(w); p.cleared = []; for (let n = 1; n <= world(w).levels; n++) p.cleared.push(n); p.unlocked = world(w).levels; }
  const p3 = prog(3); p3.cleared = [1, 2, 3]; p3.unlocked = 4;
  S.items.potion = 6; S.items.orb = 9; S.items.superpotion = 2; S.items.die = 2;
  ensureExtras(); restoreAll(); S.screen = "camp"; S.campTab = null; S.result = "Welcome back. You're at camp."; S.sound = false;
  save(); render();
  return { team: teamMons().map(m => m.name + " " + m.level), mons: Object.keys(S.mons).length, tabs: TABS.length };
})()
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", args=["--no-sandbox"])
        for dev, w, h, scale in (("iphone", 402, 874, 3), ("ipad", 1032, 1376, 2)):
            ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=scale, color_scheme=SCHEME, has_touch=True, is_mobile=True)
            pg = await ctx.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto("http://localhost:8765/index.html"); await pg.wait_for_timeout(800)
            info = await pg.evaluate(SETUP); print(dev, info)
            async def shot(name, scroll_sel=None):
                if scroll_sel:
                    await pg.evaluate("s => { const e = document.querySelector(s); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 12); }", scroll_sel)
                else: await pg.evaluate("window.scrollTo(0,0)")
                await pg.wait_for_timeout(250)
                await pg.screenshot(path=f"{OUT}/{dev}-{name}.png")
            async def act(a, arg=""):
                await pg.evaluate("([a,g]) => doAction(a, g)", [a, arg]); await pg.wait_for_timeout(200)
            async def tab(t, text):
                await act("tab", t); await pg.evaluate("t => { S.result = t; render(); }", text)
            await act("tab", "levels"); await pg.evaluate("S.campTab = null; S.result = \"Welcome back. You're at camp.\"; render()")
            await shot("03-camp")
            await tab("levels", "Levels. World 3, the Ember Shard: 3 of its levels cleared."); await shot("06-levels")
            await tab("collection", "Collection. 15 of 120 monsters caught."); await shot("05-collection")
            await tab("team", "Team and base. Blazefang leads your team."); await shot("04-team", "#screen")
            await pg.evaluate("S.campTab = null; const m = startLevel(3, 4); S.result = m.join(' '); render()"); await shot("02-board")
            for i in range(60):
                if await pg.evaluate("S.screen") == "battle": break
                await pg.evaluate("S.screen === 'level' && doAction('roll', '')"); await pg.wait_for_timeout(150)
            print(dev, "screen:", await pg.evaluate("S.screen"), "| result:", (await pg.inner_text('#result'))[:120])
            await shot("01-battle")
            print(dev, "errors:", errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
