//----------------------------------------------------SYMBOL APPEARANCE-------------------------------------------------------------------------

/**
 * @type {Array<Array<number>>}
 * @const
 */
var colorsPolygons = new Array(15);
colorsPolygons[0] = [251,128,114];
colorsPolygons[1] = [179,222,105];
colorsPolygons[2] = [128,177,211];
colorsPolygons[3] = [255,237,111];
colorsPolygons[4] = [190,186,218];
colorsPolygons[5] = [141,211,199];
colorsPolygons[6] = [253,180,98];
colorsPolygons[7] = [188,128,189];
colorsPolygons[8] = [255,255,179];
colorsPolygons[9] = [252,205,229];
colorsPolygons[10] = [217,217,217];
colorsPolygons[11] = [204,235,197];
colorsPolygons[12] = [0, 0, 0];
colorsPolygons[13] = [192, 192, 192];
colorsPolygons[14] = [255, 255, 255];
colorsPolygons[15] = [0, 0, 0];
colorsPolygons[16] = [192, 192, 192];
colorsPolygons[17] = [255, 255, 255];

var colorsPoints = new Array(26);
colorsPoints[0] = [251,128,114];
colorsPoints[1] = [179,222,105];
colorsPoints[2] = [128,177,211];
colorsPoints[3] = [255,237,111];
colorsPoints[4] = [190,186,218];
colorsPoints[5] = [141,211,199];
colorsPoints[6] = [253,180,98];
colorsPoints[7] = [188,128,189];
colorsPoints[8] = [255,255,179];
colorsPoints[9] = [252,205,229];
colorsPoints[10] = [217,217,217];
colorsPoints[11] = [204,235,197];
colorsPoints[12] = [166,206,227];
colorsPoints[13] = [255, 233, 214];
colorsPoints[14] = [178,223,138];
colorsPoints[15] = [243, 224, 255];
colorsPoints[16] = [249, 175, 174];
colorsPoints[17] = [242, 185, 89];
colorsPoints[18] = [252, 176, 213];
colorsPoints[19] = [219, 219, 201];
colorsPoints[20] = [173, 184, 237];
colorsPoints[21] = [206, 237, 173];
colorsPoints[22] = [255,255,153];
colorsPoints[23] = [142, 124, 124];
colorsPoints[24] = [205, 229, 244];
colorsPoints[25] = [239, 153, 110];

var colorsMarking = new Array(19);
colorsMarking[0] = [227,26,28];
colorsMarking[1] = [31,120,180];
colorsMarking[2] = [51,160,44];
colorsMarking[3] = [255,127,0];
colorsMarking[4] = [106,61,154];
colorsMarking[5] = [177,89,40];
colorsMarking[6] = [255,255,153];
colorsMarking[7] = [251,154,153];
colorsMarking[8] = [166,206,227];
colorsMarking[9] = [178,223,138];
colorsMarking[10] = [253,191,111];
colorsMarking[11] = [202,178,214];

colorsMarking[12] = [255,0,0];
colorsMarking[13] = [0,255,0];
colorsMarking[14] = [0,0,255];
colorsMarking[15] = [255,255,0];
colorsMarking[16] = [0,255,255];
colorsMarking[17] = [0,0,0];
colorsMarking[18] = [255,255,255];


    /**
     * @type {Array<string>}
     * @const
     */
var letters = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", 
                "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
                "1", "2", "3", "4", "5", "6", "7", "8", "9",
                "~", "*", "+", "#", "&", "?", "!", "$", "@", "%", "^", ":", "-", "|", "(", ")", "/", "\\", ".", "<", ">", "[", "]",
                "aa","ab","ac","ad","ae","af","ag","ah","ai","aj","ak","al","an","ao","ap","aq","ar","as","at","au","av","ax","ay","az","a1","a2","a3","a4","a5","a6","a7","a8","a9",
                "ba","bb","bc","bd","be","bf","bg","bh","bi","bj","bk","bl","bn","bo","bp","bq","br","bs","bt","bu","bv","bx","by","bz","b1","b2","b3","b4","b5","b6","b7","b8","b9",
                "ca","cb","cc","cd","ce","cf","cg","ch","ci","cj","ck","cl","cn","co","cp","cq","cr","cs","ct","cu","cv","cx","cy","cz","c1","c2","c3","c4","c5","c6","c7","c8","c9",
                "da","db","dc","dd","de","df","dg","dh","di","dj","dk","dl","dn","do","dp","dq","dr","ds","dt","du","dv","dx","dy","dz","d1","d2","d3","d4","d5","d6","d7","d8","d9",
                "ea","eb","ec","ed","ee","ef","eg","eh","ei","ej","ek","el","en","eo","ep","eq","er","es","et","eu","ev","ex","ey","ez","e1","e2","e3","e4","e5","e6","e7","e8","e9",
                "fa","fb","fc","fd","fe","ff","fg","fh","fi","fj","fk","fl","fn","fo","fp","fq","fr","fs","ft","fu","fv","fx","fy","fz","f1","f2","f3","f4","f5","f6","f7","f8","f9",
                "ga","gb","gc","gd","ge","gf","gg","gh","gi","gj","gk","gl","gn","go","gp","gq","gr","gs","gt","gu","gv","gx","gy","gz","g1","g2","g3","g4","g5","g6","g7","g8","g9",
                "ha","hb","hc","hd","he","hf","hg","hh","hi","hj","hk","hl","hn","ho","hp","hq","hr","hs","ht","hu","hv","hx","hy","hz","h1","h2","h3","h4","h5","h6","h7","h8","h9",
                "ia","ib","ic","id","ie","if","ig","ih","ii","ij","ik","il","in","io","ip","iq","ir","is","it","iu","iv","ix","iy","iz","i1","i2","i3","i4","i5","i6","i7","i8","i9",
                "ja","jb","jc","jd","je","jf","jg","jh","ji","jj","jk","jl","jn","jo","jp","jq","jr","js","jt","ju","jv","jx","jy","jz","j1","j2","j3","j4","j5","j6","j7","j8","j9",
                "ka","kb","kc","kd","ke","kf","kg","kh","ki","kj","kk","kl","kn","ko","kp","kq","kr","ks","kt","ku","kv","kx","ky","kz","k1","k2","k3","k4","k5","k6","k7","k8","k9",
                "la","lb","lc","ld","le","lf","lg","lh","li","lj","lk","ll","ln","lo","lp","lq","lr","ls","lt","lu","lv","lx","ly","lz","l1","l2","l3","l4","l5","l6","l7","l8","l9",
                "na","nb","nc","nd","ne","nf","ng","nh","ni","nj","nk","nl","nn","no","np","nq","nr","ns","nt","nu","nv","nx","ny","nz","n1","n2","n3","n4","n5","n6","n7","n8","n9",
                "oa","ob","oc","od","oe","of","og","oh","oi","oj","ok","ol","on","oo","op","oq","or","os","ot","ou","ov","ox","oy","oz","o1","o2","o3","o4","o5","o6","o7","o8","o9",
                "pa","pb","pc","pd","pe","pf","pg","ph","pi","pj","pk","pl","pn","po","pp","pq","pr","ps","pt","pu","pv","px","py","pz","p1","p2","p3","p4","p5","p6","p7","p8","p9",
                "qa","qb","qc","qd","qe","qf","qg","qh","qi","qj","qk","ql","qn","qo","qp","qq","qr","qs","qt","qu","qv","qx","qy","qz","q1","q2","q3","q4","q5","q6","q7","q8","q9",
                "ra","rb","rc","rd","re","rf","rg","rh","ri","rj","rk","rl","rn","ro","rp","rq","rr","rs","rt","ru","rv","rx","ry","rz","r1","r2","r3","r4","r5","r6","r7","r8","r9",
                "sa","sb","sc","sd","se","sf","sg","sh","si","sj","sk","sl","sn","so","sp","sq","sr","ss","st","su","sv","sx","sy","sz","s1","s2","s3","s4","s5","s6","s7","s8","s9",
                "ta","tb","tc","td","te","tf","tg","th","ti","tj","tk","tl","tn","to","tp","tq","tr","ts","tt","tu","tv","tx","ty","tz","t1","t2","t3","t4","t5","t6","t7","t8","t9",
                "ua","ub","uc","ud","ue","uf","ug","uh","ui","uj","uk","ul","un","uo","up","uq","ur","us","ut","uu","uv","ux","uy","uz","u1","u2","u3","u4","u5","u6","u7","u8","u9",
                "va","vb","vc","vd","ve","vf","vg","vh","vi","vj","vk","vl","vn","vo","vp","vq","vr","vs","vt","vu","vv","vx","vy","vz","v1","v2","v3","v4","v5","v6","v7","v8","v9",
                "xa","xb","xc","xd","xe","xf","xg","xh","xi","xj","xk","xl","xn","xo","xp","xq","xr","xs","xt","xu","xv","xx","xy","xz","x1","x2","x3","x4","x5","x6","x7","x8","x9",
                "ya","yb","yc","yd","ye","yf","yg","yh","yi","yj","yk","yl","yn","yo","yp","yq","yr","ys","yt","yu","yv","yx","yy","yz","y1","y2","y3","y4","y5","y6","y7","y8","y9",
                "za","zb","zc","zd","ze","zf","zg","zh","zi","zj","zk","zl","zn","zo","zp","zq","zr","zs","zt","zu","zv","zx","zy","zz","z1","z2","z3","z4","z5","z6","z7","z8","z9",
                "1a","1b","1c","1d","1e","1f","1g","1h","1i","1j","1k","1l","1n","1o","1p","1q","1r","1s","1t","1u","1v","1x","1y","1z","11","12","13","14","15","16","17","18","19",
                "2a","2b","2c","2d","2e","2f","2g","2h","2i","2j","2k","2l","2n","2o","2p","2q","2r","2s","2t","2u","2v","2x","2y","2z","21","22","23","24","25","26","27","28","29",
                "3a","3b","3c","3d","3e","3f","3g","3h","3i","3j","3k","3l","3n","3o","3p","3q","3r","3s","3t","3u","3v","3x","3y","3z","31","32","33","34","35","36","37","38","39",
                "4a","4b","4c","4d","4e","4f","4g","4h","4i","4j","4k","4l","4n","4o","4p","4q","4r","4s","4t","4u","4v","4x","4y","4z","41","42","43","44","45","46","47","48","49",
                "5a","5b","5c","5d","5e","5f","5g","5h","5i","5j","5k","5l","5n","5o","5p","5q","5r","5s","5t","5u","5v","5x","5y","5z","51","52","53","54","55","56","57","58","59",
                "6a","6b","6c","6d","6e","6f","6g","6h","6i","6j","6k","6l","6n","6o","6p","6q","6r","6s","6t","6u","6v","6x","6y","6z","61","62","63","64","65","66","67","68","69",
                "7a","7b","7c","7d","7e","7f","7g","7h","7i","7j","7k","7l","7n","7o","7p","7q","7r","7s","7t","7u","7v","7x","7y","7z","71","72","73","74","75","76","77","78","79",
                "8a","8b","8c","8d","8e","8f","8g","8h","8i","8j","8k","8l","8n","8o","8p","8q","8r","8s","8t","8u","8v","8x","8y","8z","81","82","83","84","85","86","87","88","89",
                "9a","9b","9c","9d","9e","9f","9g","9h","9i","9j","9k","9l","9n","9o","9p","9q","9r","9s","9t","9u","9v","9x","9y","9z","91","92","93","94","95","96","97","98","99"];

/**
 * @type {Array<string>}
 * @const
 */
var shapes = [
    'circle',
    'rect',
    'hex_flat',
    'hex_pointy',
    'house',
    'house_i', 
    'rectcutoffbr',
    'rectcutofftr',
    'rectcutofftl',
    'rectcutoffbl',
    'rhomb',
    'triangle',
    'triangle_i',
];





/**
 * @const
 * @type {number}
 */
var symbolSize = 18;

/**
 * @const
 * @type {number}
 */
var markingSize = 3;

/**
 * @param {Object<string, ?>} symbolInfo
 * 
 * @return {number}
 */
function markingScaleFunction (symbolInfo){
    switch(symbolInfo["shape"]){
		case "circle":
			return 1.0;
		break;
	
		case "rect":
			return 1.0;
		break;
	
		case "triangle":
			return 2.0;
		break;
	
		case "triangle_i":
			return 2.0;
		break;
	
		case "hex_flat":
			return 1.3;
		break;
	
		case "hex_pointy":
			return 1.3;
		break;
	
	    case "rhomb":
	    	return 1.7;
		break;
	
	    case "house":
	    	return 1.3;
		break;

	    case "house_i":
	    	return 1.3;
		break;
	
		case "rectcutoffbr":
			return 1.3;	  			
		break;
	
		case "rectcutofftr":
			return 1.3;
		break;
	
		case "rectcutofftl":
			return 1.3;			  			
		break;
	
		case "rectcutoffbl":
			return 1.3;
		break;
    }
    return 1;
}

/**
 *
 * Sliders to change polygon and line string stroke weight and opacity
 *
 * @const{boolean} 
 */
var showSliders = false;

/**
 * @type {ColorScheme}
 * @const
 */
var colorScheme = new ColorScheme(
    [new Feature("shape", shapes)], 
    [new Feature("color", colorsPoints, false, 26), new Feature("letter", letters)], 
    [new Feature("mcolor", colorsMarking)], colorsPolygons);

/**
 * @type{number}
 * @const
 * 
 * For efficiency reasons only a certain size of multi symbols is allowed, so that it's bounds can be precomputed
 */
var multiSymbolTableSize = 40;

/**
 * @type{number}
 * @const
 * 
 * in percent; symbol enlargement for maxIdenticalIcons + 1 symbols
 */
var minimumSymbolEnlargement = 34;

/**
 * @type{number}
 * @const
 * 
 * in percent; symbol enlargement for 100 symbols
 */
var decSymbolEnlargement = 100;

/**
 * @type{Object<string,?>}
 * @const
 */
var chosenSettings = {
	"allow_single_deselect": true,
};


/**
 * @const
 * @type{{strokeWeight: number, strokeColor: string, fillOpacity: number}|function(string, boolean):{strokeWeight: number, strokeColor: string, fillOpacity: number}}
 */
var polygonSettings = function (fillColor, highlighted){
	var hex = optionManager.getOptionState("polymode") !== "phy";
	
	return {
		"strokeWeight" : hex? (highlighted? 4 : 2) : (highlighted? 2 : 1),
		"strokeColor" : hex? "GhostWhite" : fillColor,
		"fillOpacity" : hex? 1: (highlighted? 0.75 : 0.55)
	}
}


//TODO type
/**
 * @const
 */
var polygonSettingsBoth = function (fillColor){
	var hex = optionManager.getOptionState("polymode") !== "phy";
	
	return {
		"fill_alpha" : hex? 1: 0.55,
		"stroke_color" : hex? "0xf8f8ff" : fillColor,
		"hover_fill_alpha" : hex? 1: 0.75,
		"hover_stroke_color" : hex? "0xf8f8ff" : fillColor
	}
}




/**
 * @const
 * @type {number}
 * 
 * All symbols created are upscaled by that factor and afterwards downscaled for visualisation on the map to support e.g. retina displays
 */
var symbolRescaleFactor = 2;