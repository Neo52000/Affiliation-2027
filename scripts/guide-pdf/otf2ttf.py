import sys
from fontTools.ttLib import TTFont, newTable
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
def conv(src, dst):
    f = TTFont(src); gs = f.getGlyphSet(); glyf = {}
    for n in f.getGlyphOrder():
        p = TTGlyphPen(gs); gs[n].draw(Cu2QuPen(p, 1.0, reverse_direction=True)); glyf[n] = p.glyph()
    f["loca"] = newTable("loca"); f["glyf"] = g = newTable("glyf"); g.glyphOrder = f.getGlyphOrder(); g.glyphs = glyf
    del f["CFF "]
    if "VORG" in f: del f["VORG"]
    f["maxp"] = m = f["maxp"]; m.tableVersion = 0x00010000
    for a in ("maxZones","maxTwilightPoints","maxStorage","maxFunctionDefs","maxInstructionDefs","maxStackElements","maxSizeOfInstructions","maxComponentElements"): setattr(m,a,0)
    m.maxZones=1; m.maxComponentDepth=0
    f["head"].glyphDataFormat = 0; f["post"].formatType = 2.0; f["post"].extraNames = []; f["post"].mapping = {}; f.sfntVersion = "\x00\x01\x00\x00"
    f.save(dst)
for n in sys.argv[1:]:
    conv(f"/usr/share/fonts/opentype/inter/{n}.otf", f"fonts/{n}.ttf")
