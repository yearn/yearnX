if (!self.define) {
	let e,
		s = {};
	const c = (c, n) => (
		(c = new URL(c + '.js', n).href),
		s[c] ||
			new Promise(s => {
				if ('document' in self) {
					const e = document.createElement('script');
					(e.src = c), (e.onload = s), document.head.appendChild(e);
				} else (e = c), importScripts(c), s();
			}).then(() => {
				let e = s[c];
				if (!e) throw new Error(`Module ${c} didn’t register its module`);
				return e;
			})
	);
	self.define = (n, a) => {
		const i = e || ('document' in self ? document.currentScript.src : '') || location.href;
		if (s[i]) return;
		let t = {};
		const r = e => c(e, i),
			d = {module: {uri: i}, exports: t, require: r};
		s[i] = Promise.all(n.map(e => d[e] || r(e))).then(e => (a(...e), t));
	};
}
define(['./workbox-49f2c8c8'], function (e) {
	'use strict';
	importScripts(),
		self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{url: '/_next/dynamic-css-manifest.json', revision: 'd751713988987e9331980363e24189ce'},
				{
					url: '/_next/static/Y-0MzJAWnGIrFFKht8TlR/_buildManifest.js',
					revision: 'c42186160906f2df2e7bfbc67ce78a70'
				},
				{
					url: '/_next/static/Y-0MzJAWnGIrFFKht8TlR/_ssgManifest.js',
					revision: 'b6652df95db52feb4daf4eca35380933'
				},
				{url: '/_next/static/chunks/1008.317748355f5b0099.js', revision: '317748355f5b0099'},
				{url: '/_next/static/chunks/1177.f107ce01132cad7a.js', revision: 'f107ce01132cad7a'},
				{url: '/_next/static/chunks/1187.a16d55cd17da4220.js', revision: 'a16d55cd17da4220'},
				{url: '/_next/static/chunks/1217.d53d62af08e3a5fb.js', revision: 'd53d62af08e3a5fb'},
				{url: '/_next/static/chunks/1227.3df172c41f07cba9.js', revision: '3df172c41f07cba9'},
				{url: '/_next/static/chunks/1237.e8584e0598216734.js', revision: 'e8584e0598216734'},
				{url: '/_next/static/chunks/1311.e7375c86e7b4c3ed.js', revision: 'e7375c86e7b4c3ed'},
				{url: '/_next/static/chunks/1330.fedee96368eb48cb.js', revision: 'fedee96368eb48cb'},
				{url: '/_next/static/chunks/1348.a735f6ce530c4955.js', revision: 'a735f6ce530c4955'},
				{url: '/_next/static/chunks/1585.426c31eaff39b1e0.js', revision: '426c31eaff39b1e0'},
				{url: '/_next/static/chunks/1622.332ec9a87073be44.js', revision: '332ec9a87073be44'},
				{url: '/_next/static/chunks/1636.d30cafc911f8c153.js', revision: 'd30cafc911f8c153'},
				{url: '/_next/static/chunks/1671.62cba1e92883e858.js', revision: '62cba1e92883e858'},
				{url: '/_next/static/chunks/1754.9fd204296b3eed12.js', revision: '9fd204296b3eed12'},
				{url: '/_next/static/chunks/1758.68191891cf205eaa.js', revision: '68191891cf205eaa'},
				{url: '/_next/static/chunks/1802.cd9e2cdd8921c8f0.js', revision: 'cd9e2cdd8921c8f0'},
				{url: '/_next/static/chunks/181.fdabb0e4e802064c.js', revision: 'fdabb0e4e802064c'},
				{url: '/_next/static/chunks/1832.66b727d862d485e4.js', revision: '66b727d862d485e4'},
				{url: '/_next/static/chunks/1853.d62c81adeec394c6.js', revision: 'd62c81adeec394c6'},
				{url: '/_next/static/chunks/1870.c651bc8c312348c4.js', revision: 'c651bc8c312348c4'},
				{url: '/_next/static/chunks/1878.f3bccf3065c83b62.js', revision: 'f3bccf3065c83b62'},
				{url: '/_next/static/chunks/1891.553479eda7c0d204.js', revision: '553479eda7c0d204'},
				{url: '/_next/static/chunks/1892.35cc1b5147b76a7d.js', revision: '35cc1b5147b76a7d'},
				{url: '/_next/static/chunks/2083.f8bd1518578b09a8.js', revision: 'f8bd1518578b09a8'},
				{url: '/_next/static/chunks/2162.3ac62e86a1753a81.js', revision: '3ac62e86a1753a81'},
				{url: '/_next/static/chunks/2270.ead67da83f125e2a.js', revision: 'ead67da83f125e2a'},
				{url: '/_next/static/chunks/228.7368f51323e0cd86.js', revision: '7368f51323e0cd86'},
				{url: '/_next/static/chunks/2360.56e03c55c1d57b52.js', revision: '56e03c55c1d57b52'},
				{url: '/_next/static/chunks/2431.2a730135eb6ecfdb.js', revision: '2a730135eb6ecfdb'},
				{url: '/_next/static/chunks/2441.4ad8b2af3d5f4de9.js', revision: '4ad8b2af3d5f4de9'},
				{url: '/_next/static/chunks/2500.55c43f08a811ef4a.js', revision: '55c43f08a811ef4a'},
				{url: '/_next/static/chunks/26.36444c71a5b30205.js', revision: '36444c71a5b30205'},
				{url: '/_next/static/chunks/2688.8cc3ead9d4bf1daa.js', revision: '8cc3ead9d4bf1daa'},
				{url: '/_next/static/chunks/2801.36c75d244a5d18fc.js', revision: '36c75d244a5d18fc'},
				{url: '/_next/static/chunks/2856.2b3bf9ebf9a8cfb1.js', revision: '2b3bf9ebf9a8cfb1'},
				{url: '/_next/static/chunks/2932.f3ce5ca751e5ea67.js', revision: 'f3ce5ca751e5ea67'},
				{url: '/_next/static/chunks/3027.f53627cb77134e4f.js', revision: 'f53627cb77134e4f'},
				{url: '/_next/static/chunks/3037.4d43fb4e155aae59.js', revision: '4d43fb4e155aae59'},
				{url: '/_next/static/chunks/3047.71788abbbb3740ca.js', revision: '71788abbbb3740ca'},
				{url: '/_next/static/chunks/3151.4f41fae5f35b0c14.js', revision: '4f41fae5f35b0c14'},
				{url: '/_next/static/chunks/3170.e03a42eb3cf30072.js', revision: 'e03a42eb3cf30072'},
				{url: '/_next/static/chunks/325.8c7eeed2c0db37b8.js', revision: '8c7eeed2c0db37b8'},
				{url: '/_next/static/chunks/33.7a19a90adc07829c.js', revision: '7a19a90adc07829c'},
				{url: '/_next/static/chunks/3313.ccc71834dba5db50.js', revision: 'ccc71834dba5db50'},
				{url: '/_next/static/chunks/3410.4a6daaf81752c391.js', revision: '4a6daaf81752c391'},
				{url: '/_next/static/chunks/3487.68931ac03a75dda2.js', revision: '68931ac03a75dda2'},
				{url: '/_next/static/chunks/3546.f70621857db8ba4d.js', revision: 'f70621857db8ba4d'},
				{url: '/_next/static/chunks/3610.8252bc138d60e49b.js', revision: '8252bc138d60e49b'},
				{url: '/_next/static/chunks/37.3d93156d9930a6d7.js', revision: '3d93156d9930a6d7'},
				{url: '/_next/static/chunks/3764.a6399355c4ba1a06.js', revision: 'a6399355c4ba1a06'},
				{url: '/_next/static/chunks/3854.c6e7ce8bfda1b76f.js', revision: 'c6e7ce8bfda1b76f'},
				{url: '/_next/static/chunks/3898.0d8b0d321d3c0a1d.js', revision: '0d8b0d321d3c0a1d'},
				{url: '/_next/static/chunks/3974.aa378765597448cf.js', revision: 'aa378765597448cf'},
				{url: '/_next/static/chunks/402.42610722d576d710.js', revision: '42610722d576d710'},
				{url: '/_next/static/chunks/4093.4a9d8b7be3c97c79.js', revision: '4a9d8b7be3c97c79'},
				{url: '/_next/static/chunks/4125.9e2cbb1fcf0e5956.js', revision: '9e2cbb1fcf0e5956'},
				{url: '/_next/static/chunks/4147.8da7bb247b714d57.js', revision: '8da7bb247b714d57'},
				{url: '/_next/static/chunks/4163.642ae367e4214658.js', revision: '642ae367e4214658'},
				{url: '/_next/static/chunks/4288.ff2f4c1e3225fe8a.js', revision: 'ff2f4c1e3225fe8a'},
				{url: '/_next/static/chunks/4384.d2df3c07947c98ee.js', revision: 'd2df3c07947c98ee'},
				{url: '/_next/static/chunks/4438.05ba44bd43c249a8.js', revision: '05ba44bd43c249a8'},
				{url: '/_next/static/chunks/4470.d1d615334cac9c45.js', revision: 'd1d615334cac9c45'},
				{url: '/_next/static/chunks/451.281763aa37c06d84.js', revision: '281763aa37c06d84'},
				{url: '/_next/static/chunks/4540.a46a50b1bdfeb8ac.js', revision: 'a46a50b1bdfeb8ac'},
				{url: '/_next/static/chunks/4545.d33f34f8bd3651b7.js', revision: 'd33f34f8bd3651b7'},
				{url: '/_next/static/chunks/4556.fe0026952e9376e8.js', revision: 'fe0026952e9376e8'},
				{url: '/_next/static/chunks/4646.53d453ab864bb11e.js', revision: '53d453ab864bb11e'},
				{url: '/_next/static/chunks/468.ca5bdb5571c01bb0.js', revision: 'ca5bdb5571c01bb0'},
				{url: '/_next/static/chunks/4713.c8b52e1ec862c42a.js', revision: 'c8b52e1ec862c42a'},
				{url: '/_next/static/chunks/4778.b538e43a78b575d2.js', revision: 'b538e43a78b575d2'},
				{url: '/_next/static/chunks/4813.447d2536dbc5d9fb.js', revision: '447d2536dbc5d9fb'},
				{url: '/_next/static/chunks/4838.c056d5201ba9391e.js', revision: 'c056d5201ba9391e'},
				{url: '/_next/static/chunks/4861.95d82aec747ac37c.js', revision: '95d82aec747ac37c'},
				{url: '/_next/static/chunks/4899.bb89fd3d0a4bcfa8.js', revision: 'bb89fd3d0a4bcfa8'},
				{url: '/_next/static/chunks/4926.a6479999c295470a.js', revision: 'a6479999c295470a'},
				{url: '/_next/static/chunks/4957.2e8834c4e44ff6f3.js', revision: '2e8834c4e44ff6f3'},
				{url: '/_next/static/chunks/4962.acc7e56e81acceb9.js', revision: 'acc7e56e81acceb9'},
				{url: '/_next/static/chunks/5019.cd4551923fb2bffd.js', revision: 'cd4551923fb2bffd'},
				{url: '/_next/static/chunks/5025.0169ffe012fd1b93.js', revision: '0169ffe012fd1b93'},
				{url: '/_next/static/chunks/5043.ebae4072e8ade865.js', revision: 'ebae4072e8ade865'},
				{url: '/_next/static/chunks/5055.4c7adabee88e62e7.js', revision: '4c7adabee88e62e7'},
				{url: '/_next/static/chunks/5106.92f82a570cb878d2.js', revision: '92f82a570cb878d2'},
				{url: '/_next/static/chunks/5193.59f6e2d094f5b48f.js', revision: '59f6e2d094f5b48f'},
				{url: '/_next/static/chunks/530.7ff472130eb48335.js', revision: '7ff472130eb48335'},
				{url: '/_next/static/chunks/5547.91e154c428420bb6.js', revision: '91e154c428420bb6'},
				{url: '/_next/static/chunks/5571.cfdd753d183328b0.js', revision: 'cfdd753d183328b0'},
				{url: '/_next/static/chunks/5595.5edccce56a0dac36.js', revision: '5edccce56a0dac36'},
				{url: '/_next/static/chunks/5622.349fb0be4f8e4ca0.js', revision: '349fb0be4f8e4ca0'},
				{url: '/_next/static/chunks/5645.d7f983bfa4959e08.js', revision: 'd7f983bfa4959e08'},
				{url: '/_next/static/chunks/5648.c68d0f4ad88e5563.js', revision: 'c68d0f4ad88e5563'},
				{url: '/_next/static/chunks/5677.36f6bc9c7d1c2dc9.js', revision: '36f6bc9c7d1c2dc9'},
				{url: '/_next/static/chunks/5689.6cadefa90d405d66.js', revision: '6cadefa90d405d66'},
				{url: '/_next/static/chunks/5870.4dfe33213edeb273.js', revision: '4dfe33213edeb273'},
				{url: '/_next/static/chunks/589.498f9fa0d0b70888.js', revision: '498f9fa0d0b70888'},
				{url: '/_next/static/chunks/5952.6c54b48349b194f6.js', revision: '6c54b48349b194f6'},
				{url: '/_next/static/chunks/5963.6b03d55a2d6f356e.js', revision: '6b03d55a2d6f356e'},
				{url: '/_next/static/chunks/6012.194e39ae986587cf.js', revision: '194e39ae986587cf'},
				{url: '/_next/static/chunks/6149.5e8c8d8827ae2f29.js', revision: '5e8c8d8827ae2f29'},
				{url: '/_next/static/chunks/6183.c4784be97437ff7e.js', revision: 'c4784be97437ff7e'},
				{url: '/_next/static/chunks/6223.3f5a6529a706ca25.js', revision: '3f5a6529a706ca25'},
				{url: '/_next/static/chunks/6370.ca0b6cce1911df3f.js', revision: 'ca0b6cce1911df3f'},
				{url: '/_next/static/chunks/6465.47e247bafd4cb2e6.js', revision: '47e247bafd4cb2e6'},
				{url: '/_next/static/chunks/6534.fe56653370a481cf.js', revision: 'fe56653370a481cf'},
				{url: '/_next/static/chunks/6609.0704c42fe426782e.js', revision: '0704c42fe426782e'},
				{url: '/_next/static/chunks/6639.9d8b403696b68c2d.js', revision: '9d8b403696b68c2d'},
				{url: '/_next/static/chunks/6756.a599601101e2939a.js', revision: 'a599601101e2939a'},
				{url: '/_next/static/chunks/6761.195f8c48364ae9d1.js', revision: '195f8c48364ae9d1'},
				{url: '/_next/static/chunks/6872.228a43cffed280a6.js', revision: '228a43cffed280a6'},
				{url: '/_next/static/chunks/6916.62d7334869d822b0.js', revision: '62d7334869d822b0'},
				{url: '/_next/static/chunks/6955.4ebffaed69a41e45.js', revision: '4ebffaed69a41e45'},
				{url: '/_next/static/chunks/7065.5f538a42ec304112.js', revision: '5f538a42ec304112'},
				{url: '/_next/static/chunks/7094.fe3fc786c8fff0fa.js', revision: 'fe3fc786c8fff0fa'},
				{url: '/_next/static/chunks/7239.592d742e330dbd96.js', revision: '592d742e330dbd96'},
				{url: '/_next/static/chunks/7270.e2c126ad919857b9.js', revision: 'e2c126ad919857b9'},
				{url: '/_next/static/chunks/7310.4e528ae20f2f969e.js', revision: '4e528ae20f2f969e'},
				{url: '/_next/static/chunks/7329.349468011a2460c1.js', revision: '349468011a2460c1'},
				{url: '/_next/static/chunks/7360.8d0a76351f4055a9.js', revision: '8d0a76351f4055a9'},
				{url: '/_next/static/chunks/7393.25e7afd9ad887529.js', revision: '25e7afd9ad887529'},
				{url: '/_next/static/chunks/7447.3f94667f87462844.js', revision: '3f94667f87462844'},
				{url: '/_next/static/chunks/7488.1f8dde3db120e8d1.js', revision: '1f8dde3db120e8d1'},
				{url: '/_next/static/chunks/7491.3e2bec4fc7d102da.js', revision: '3e2bec4fc7d102da'},
				{url: '/_next/static/chunks/7580.fe7c0dfead2497e6.js', revision: 'fe7c0dfead2497e6'},
				{url: '/_next/static/chunks/7603.c34277e99f73c7c0.js', revision: 'c34277e99f73c7c0'},
				{url: '/_next/static/chunks/7610.60591228448f57bf.js', revision: '60591228448f57bf'},
				{url: '/_next/static/chunks/7783.ddfd4dc8eb208fe5.js', revision: 'ddfd4dc8eb208fe5'},
				{url: '/_next/static/chunks/7911ce14.f13d1989c87fa385.js', revision: 'f13d1989c87fa385'},
				{url: '/_next/static/chunks/7960.188729200e99098c.js', revision: '188729200e99098c'},
				{url: '/_next/static/chunks/8008.6de7ad1bf4bf7406.js', revision: '6de7ad1bf4bf7406'},
				{url: '/_next/static/chunks/8097.5283852b7a4d25fc.js', revision: '5283852b7a4d25fc'},
				{url: '/_next/static/chunks/8245.46eb13c73c348127.js', revision: '46eb13c73c348127'},
				{url: '/_next/static/chunks/8263.6a44995becf9d79c.js', revision: '6a44995becf9d79c'},
				{url: '/_next/static/chunks/8340.646f45c460eeab99.js', revision: '646f45c460eeab99'},
				{url: '/_next/static/chunks/8354.4c4757a25fb15b0b.js', revision: '4c4757a25fb15b0b'},
				{url: '/_next/static/chunks/8419.6db649d195cc4e44.js', revision: '6db649d195cc4e44'},
				{url: '/_next/static/chunks/8424.2f5030586586722b.js', revision: '2f5030586586722b'},
				{url: '/_next/static/chunks/8426-c1a4d77aa9b05cb6.js', revision: 'c1a4d77aa9b05cb6'},
				{url: '/_next/static/chunks/8497.33d160a6be7a8d34.js', revision: '33d160a6be7a8d34'},
				{url: '/_next/static/chunks/8556.22058a25f47e17d3.js', revision: '22058a25f47e17d3'},
				{url: '/_next/static/chunks/8574.41e4da4e28f622e9.js', revision: '41e4da4e28f622e9'},
				{url: '/_next/static/chunks/8590.49fa2ac318eed432.js', revision: '49fa2ac318eed432'},
				{url: '/_next/static/chunks/8634.d6444b3883f791cf.js', revision: 'd6444b3883f791cf'},
				{url: '/_next/static/chunks/8678.e7909ffa6ff93da7.js', revision: 'e7909ffa6ff93da7'},
				{url: '/_next/static/chunks/8711.bc4c87f50ec7fd8a.js', revision: 'bc4c87f50ec7fd8a'},
				{url: '/_next/static/chunks/8726.2a9e74b76acf8042.js', revision: '2a9e74b76acf8042'},
				{url: '/_next/static/chunks/8752.6252be0a69b0e797.js', revision: '6252be0a69b0e797'},
				{url: '/_next/static/chunks/8775.e23a5f2539ae223b.js', revision: 'e23a5f2539ae223b'},
				{url: '/_next/static/chunks/8873.b64cddcd6f4ff305.js', revision: 'b64cddcd6f4ff305'},
				{url: '/_next/static/chunks/8912.50b95806d3e06b4b.js', revision: '50b95806d3e06b4b'},
				{url: '/_next/static/chunks/8966.61c67f26026cfec2.js', revision: '61c67f26026cfec2'},
				{url: '/_next/static/chunks/8b63013a.57bef95a786fca15.js', revision: '57bef95a786fca15'},
				{url: '/_next/static/chunks/8d4b09ac.2f31c01e5072b997.js', revision: '2f31c01e5072b997'},
				{url: '/_next/static/chunks/9005.5cedb043ebb5970b.js', revision: '5cedb043ebb5970b'},
				{url: '/_next/static/chunks/9097.1acc0de444e08136.js', revision: '1acc0de444e08136'},
				{url: '/_next/static/chunks/9162.637c6e61a34c1750.js', revision: '637c6e61a34c1750'},
				{url: '/_next/static/chunks/9163.4c235ee4655121d6.js', revision: '4c235ee4655121d6'},
				{url: '/_next/static/chunks/9265.a13e3702af18f8f7.js', revision: 'a13e3702af18f8f7'},
				{url: '/_next/static/chunks/9394.f067e0741502d322.js', revision: 'f067e0741502d322'},
				{url: '/_next/static/chunks/943.b2a7e0b77625034e.js', revision: 'b2a7e0b77625034e'},
				{url: '/_next/static/chunks/9449.cb30d976320f9b52.js', revision: 'cb30d976320f9b52'},
				{url: '/_next/static/chunks/9468.4963dd32a258959e.js', revision: '4963dd32a258959e'},
				{url: '/_next/static/chunks/9475.a2009634ebbeaf20.js', revision: 'a2009634ebbeaf20'},
				{url: '/_next/static/chunks/9523.51d6834cb68e67a1.js', revision: '51d6834cb68e67a1'},
				{url: '/_next/static/chunks/9670.0c1f01a0f0bd1990.js', revision: '0c1f01a0f0bd1990'},
				{url: '/_next/static/chunks/9825.46c101ac7914f162.js', revision: '46c101ac7914f162'},
				{url: '/_next/static/chunks/9836.ed4728a28ad2746f.js', revision: 'ed4728a28ad2746f'},
				{url: '/_next/static/chunks/9844.f3469ac0553750c2.js', revision: 'f3469ac0553750c2'},
				{url: '/_next/static/chunks/9877.a823228af2ad4986.js', revision: 'a823228af2ad4986'},
				{url: '/_next/static/chunks/9961.4d20462473096cb6.js', revision: '4d20462473096cb6'},
				{url: '/_next/static/chunks/997.62cb049f02f0d844.js', revision: '62cb049f02f0d844'},
				{url: '/_next/static/chunks/9983.294bf9dd1568e9f3.js', revision: '294bf9dd1568e9f3'},
				{url: '/_next/static/chunks/9984.30739e8c5d3d7c51.js', revision: '30739e8c5d3d7c51'},
				{url: '/_next/static/chunks/c92b2c6d.79eff2f53466635b.js', revision: '79eff2f53466635b'},
				{url: '/_next/static/chunks/d423087b-0bc756e3bb276c34.js', revision: '0bc756e3bb276c34'},
				{url: '/_next/static/chunks/framework-663aa04c6d4d8976.js', revision: '663aa04c6d4d8976'},
				{url: '/_next/static/chunks/main-da9c78d234f112e8.js', revision: 'da9c78d234f112e8'},
				{url: '/_next/static/chunks/pages/_app-c3be3d472f5709a4.js', revision: 'c3be3d472f5709a4'},
				{url: '/_next/static/chunks/pages/_error-3830db964f086a10.js', revision: '3830db964f086a10'},
				{url: '/_next/static/chunks/pages/index-73cfc4e3ecc046f4.js', revision: '73cfc4e3ecc046f4'},
				{
					url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
					revision: '846118c33b2c0e922d7b3a7676f81f6f'
				},
				{url: '/_next/static/chunks/webpack-f623bdc071a7b8d1.js', revision: 'f623bdc071a7b8d1'},
				{url: '/_next/static/css/a39153edb02aa9c8.css', revision: 'a39153edb02aa9c8'},
				{url: '/_next/static/media/1f4e78e644c8ac59-s.p.woff2', revision: '4d4a3ce5eb1a81ef1e5c3fc2ae539eb9'},
				{url: '/_next/static/media/2dd78d55e70aebb4-s.p.woff2', revision: 'e93bf40b7c01b12ad56bc2defb258ee9'},
				{url: '/_next/static/media/33ad0db21eef7aba-s.p.woff2', revision: '51fd7ca20c8ab627d9686a8804adebb4'},
				{url: '/_next/static/media/533df5b11e9c3c35-s.p.woff2', revision: '97d9f57ba57edd7ae6f5723666fb9bf8'},
				{url: '/_next/static/media/HeartbeatWorker.3ef8cf74.js', revision: '3ef8cf74'},
				{url: '/_next/static/media/a1e5a5061b7565dc-s.p.ttf', revision: 'd78aff0c55267ed43a4996cd3352a3ad'},
				{url: '/bg.png', revision: '663916eadbff3208dce5c7085023c066'},
				{url: '/bg2.png', revision: 'af269ddf2963a8720e055c05ad760ce3'},
				{url: '/bg3.png', revision: '7d3ac39ef464939295702122090b191e'},
				{url: '/favicons/android-chrome-144x144.png', revision: '47c1ec1d4d023adf383a911fe5ab25bf'},
				{url: '/favicons/android-chrome-192x192.png', revision: '68ec78616f60f1324eef47b19164a725'},
				{url: '/favicons/android-chrome-256x256.png', revision: '5426b3dfdbf1ced7bd191b6652dafec1'},
				{url: '/favicons/android-chrome-36x36.png', revision: '23bab4f6e3e3f111bbd7d5f6e1709f72'},
				{url: '/favicons/android-chrome-384x384.png', revision: '79ad089c4ed75dde9d6d785010451ce1'},
				{url: '/favicons/android-chrome-48x48.png', revision: '54ff0f8b5aecf7b4ae58114eb8457b02'},
				{url: '/favicons/android-chrome-512x512.png', revision: '22b342c18246e03b9773c671d6eba5c2'},
				{url: '/favicons/android-chrome-72x72.png', revision: '903e5fb2eee23ee9e51e8003b827239b'},
				{url: '/favicons/android-chrome-96x96.png', revision: '80d72838588bd112c4451654d05ca7d5'},
				{url: '/favicons/apple-icon-1024x1024.png', revision: 'd66aece153c9079c4bcf85b00eaca170'},
				{url: '/favicons/apple-icon-114x114.png', revision: '2bb8db939a6ed2f3ff146f9340456ef5'},
				{url: '/favicons/apple-icon-120x120.png', revision: 'cbc9eac3b098615489d43313554928e0'},
				{url: '/favicons/apple-icon-144x144.png', revision: '5ee73816848d75d393e0b2fade6da800'},
				{url: '/favicons/apple-icon-152x152.png', revision: 'e05c9db3963004723bf9aeb7418087f0'},
				{url: '/favicons/apple-icon-167x167.png', revision: '2f101572ee0c4e0ca786358982dfd575'},
				{url: '/favicons/apple-icon-180x180.png', revision: '502d8f7aed5289b238891381ca61594b'},
				{url: '/favicons/apple-icon-57x57.png', revision: '501b02aa74c69a2e61e523c13339fafe'},
				{url: '/favicons/apple-icon-60x60.png', revision: '23165ebb6a9deca22a4542323411fb7e'},
				{url: '/favicons/apple-icon-72x72.png', revision: '20a33ebca1066d6b5482f7af39ef0f3f'},
				{url: '/favicons/apple-icon-76x76.png', revision: 'e06286a9d9ddf217280d53ec40b17c8c'},
				{url: '/favicons/apple-icon-precomposed.png', revision: '502d8f7aed5289b238891381ca61594b'},
				{url: '/favicons/apple-icon.png', revision: '502d8f7aed5289b238891381ca61594b'},
				{url: '/favicons/browserconfig.xml', revision: '1128f722f0305d63b5b9e223d03d88e5'},
				{url: '/favicons/favicon-16x16.png', revision: '9beb8a0fcec59a4affa544c3f1bc200e'},
				{url: '/favicons/favicon-32x32.png', revision: 'f1ee8be7fa3e591a93746d217a4af495'},
				{url: '/favicons/favicon-48x48.png', revision: '54ff0f8b5aecf7b4ae58114eb8457b02'},
				{url: '/favicons/favicon.ico', revision: '9aeed33df2547be83f3669a5de48ab3d'},
				{url: '/favicons/index.html', revision: 'b3b985dcf402fbbfb2525fe0605af13b'},
				{url: '/favicons/manifest.json', revision: 'c758d188174586da84a3b5ee3ab53a2d'},
				{url: '/favicons/mstile-144x144.png', revision: '47c1ec1d4d023adf383a911fe5ab25bf'},
				{url: '/favicons/mstile-150x150.png', revision: 'd76d3b1c3e789e13b04822d55df1b9da'},
				{url: '/favicons/mstile-310x150.png', revision: '7e18c25546fb5c3463a6573e3d3394b0'},
				{url: '/favicons/mstile-310x310.png', revision: '74f61b9f79734dadb77af79fb9a75102'},
				{url: '/favicons/mstile-70x70.png', revision: '7027ab57366377342a2052ff54a231d2'},
				{url: '/katanaTypemark.png', revision: '3b4746ab6891837e56f89c850eb74ec7'},
				{url: '/og.png', revision: 'fd9728b43536a85a8e732c30ef26bd99'},
				{url: '/partnerLogo.png', revision: 'e50cd7b520f92e04e14b13d64c0b0bd9'},
				{url: '/placeholder.png', revision: 'ceb8d4532386b511ae90305f57087203'},
				{url: '/tokens/AUSD/logo-128.png', revision: '8ca4e48834d0d633d75765d6719d02fe'},
				{url: '/tokens/AUSD/logo-32.png', revision: '8be308cfc0a11f728d7f8e7dc3dba405'},
				{url: '/tokens/AUSD/logo.svg', revision: 'a201c56f6c81304b3d79221d873a5213'},
				{url: '/tokens/KAT/logo.jpg', revision: '4a5d491ede37738a4a0a835b6c1b301d'},
				{url: '/tokens/vbETH/logo-128.png', revision: 'fcb9b61ba432bd3e6217458096a33298'},
				{url: '/tokens/vbETH/logo-32.png', revision: '0dfd3d3b96a0ad199db471b9eeb6f07c'},
				{url: '/tokens/vbETH/logo.svg', revision: 'c3d49b1b3cfdebab7b307784c2a903d3'},
				{url: '/tokens/vbUSDC/logo-128.png', revision: '84eb72176a5dd4028ac02454a316b2f4'},
				{url: '/tokens/vbUSDC/logo-32.png', revision: 'ce766d0e3f6870dcb5562e79be4c8960'},
				{url: '/tokens/vbUSDC/logo.svg', revision: 'e97a9f148ee244108d0426b36088b41a'},
				{url: '/tokens/vbUSDS/logo-128.png', revision: '7e4e2103917b83f620f1b28c6eaa6c17'},
				{url: '/tokens/vbUSDS/logo-32.png', revision: '1bec17349c8d148c84561b27c7afd021'},
				{url: '/tokens/vbUSDS/logo.svg', revision: '8120247605485d4a2d6e32fd35a20dba'},
				{url: '/tokens/vbUSDT/logo-128.png', revision: '6bee449ba1c08e650388d240e4745175'},
				{url: '/tokens/vbUSDT/logo-32.png', revision: '968d09c31f5c762ce001c130dd56cf54'},
				{url: '/tokens/vbUSDT/logo.svg', revision: 'd7ac2769d6f1c7a846dd17df8f0f4e9e'},
				{url: '/tokens/vbWBTC/logo-128.png', revision: 'd5586faf5891cfd6f2178e17bb901b61'},
				{url: '/tokens/vbWBTC/logo-32.png', revision: '9fe57518c9629a179b626cba9a303213'},
				{url: '/tokens/vbWBTC/logo.svg', revision: '533c4c006793f2fda420c5b7223b9d7d'}
			],
			{ignoreURLParametersMatching: []}
		),
		e.cleanupOutdatedCaches(),
		e.registerRoute(
			'/',
			new e.NetworkFirst({
				cacheName: 'start-url',
				plugins: [
					{
						cacheWillUpdate: async ({request: e, response: s, event: c, state: n}) =>
							s && 'opaqueredirect' === s.type
								? new Response(s.body, {status: 200, statusText: 'OK', headers: s.headers})
								: s
					}
				]
			}),
			'GET'
		),
		e.registerRoute(
			/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
			new e.CacheFirst({
				cacheName: 'google-fonts-webfonts',
				plugins: [new e.ExpirationPlugin({maxEntries: 4, maxAgeSeconds: 31536e3})]
			}),
			'GET'
		),
		e.registerRoute(
			/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
			new e.StaleWhileRevalidate({
				cacheName: 'google-fonts-stylesheets',
				plugins: [new e.ExpirationPlugin({maxEntries: 4, maxAgeSeconds: 604800})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-font-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 4, maxAgeSeconds: 604800})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-image-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 64, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\/_next\/image\?url=.+$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'next-image',
				plugins: [new e.ExpirationPlugin({maxEntries: 64, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:mp3|wav|ogg)$/i,
			new e.CacheFirst({
				cacheName: 'static-audio-assets',
				plugins: [new e.RangeRequestsPlugin(), new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:mp4)$/i,
			new e.CacheFirst({
				cacheName: 'static-video-assets',
				plugins: [new e.RangeRequestsPlugin(), new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:js)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-js-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:css|less)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-style-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\/_next\/data\/.+\/.+\.json$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'next-data',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:json|xml|csv)$/i,
			new e.NetworkFirst({
				cacheName: 'static-data-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			({url: e}) => {
				if (!(self.origin === e.origin)) return !1;
				const s = e.pathname;
				return !s.startsWith('/api/auth/') && !!s.startsWith('/api/');
			},
			new e.NetworkFirst({
				cacheName: 'apis',
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({maxEntries: 16, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			({url: e}) => {
				if (!(self.origin === e.origin)) return !1;
				return !e.pathname.startsWith('/api/');
			},
			new e.NetworkFirst({
				cacheName: 'others',
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			({url: e}) => !(self.origin === e.origin),
			new e.NetworkFirst({
				cacheName: 'cross-origin',
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 3600})]
			}),
			'GET'
		);
});
