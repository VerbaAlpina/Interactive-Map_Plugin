//----------------------------------------------MAP SETTINGS-------------------------------------------------------------------------------------

var mapData = {
    center : new google.maps.LatLng(46.059547, 11.132220),
    zoom : 7,
    minZoom : 6,
    mapTypeId : google.maps.MapTypeId.TERRAIN
};


//----------------------------------------------------SYMBOL APPEARANCE-------------------------------------------------------------------------

/**
     * @type {Array<Array<number>>}
     * @const
     */
    var colors = new Array(15);
    colors[0] = [255, 0, 0];
    colors[1] = [0, 255, 0];
    colors[2] = [0, 0, 255];
    colors[3] = [255, 255, 0];
    colors[4] = [255, 0, 255];
    colors[5] = [0, 255, 255];
    colors[6] = [255, 128, 0];
    colors[7] = [255, 0, 128];
    colors[8] = [0, 128, 255];
    colors[9] = [128, 0, 255];
    colors[10] = [255, 192, 0];
    colors[11] = [255, 0, 192];
    colors[12] = [0, 192, 255];
    colors[13] = [192, 0, 255];
    colors[14] = [192, 255, 0];
    colors[15] = [0, 0, 0];
    colors[16] = [192, 192, 192];
    colors[17] = [255, 255, 255];

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
var shapes = ['circle', 'rect', 'triangle', 'triangle_i', 'rhomb', 'house', 'house_i', 'stripe_l', 'stripe_r'];


/**
 * @const
 * @type {number}
 */
var symbolSize = 15;

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
    [new Feature("color", colors, false, 3), new Feature("letter", letters)], 
    [new Feature("border_color", colors)], colors);
