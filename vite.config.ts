import vue from '@vitejs/plugin-vue';
import {resolve} from 'path';
import type {ConfigEnv, UserConfigExport} from 'vite';
import {loadEnv} from '/@/utils/viteBuild';
import {viteMockServe} from 'vite-plugin-mock'

const pathResolve = (dir: string): any => {
    return resolve(__dirname, '.', dir);
};

const {VITE_PORT, VITE_OPEN, VITE_PUBLIC_PATH, VITE_DROP_CONSOLE, VITE_USE_MOCK} = loadEnv();

const alias: Record<string, string> = {
    '/@': pathResolve('./src/'),
    'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js',
};

// https://vitejs.dev/config/
export default ({command}: ConfigEnv): UserConfigExport => {
    return {
        root: process.cwd(),
        resolve: {alias},
        base: process.env.NODE_ENV === 'production' ? VITE_PUBLIC_PATH : './',
        server: {
            host: '0.0.0.0',
            port: VITE_PORT,
            open: VITE_OPEN,
            proxy: {
                '/vue-admin-next': {
                    target: 'http://localhost:8888/',
                    ws: true,
                    changeOrigin: true,
                    rewrite: (path: string) => path.replace(/^\/vue-admin-next/, ''),
                },
            },
        },
        build: {
            outDir: 'dist',
            minify: 'esbuild',
            sourcemap: false,
            target: 'es2015',
            terserOptions: {
                compress: {
                    keep_infinity: true,
                    // Used to delete console in production environment
                    drop_console: VITE_DROP_CONSOLE,
                },
            },
            // Turning off brotliSize display can slightly reduce packaging time
            brotliSize: false,
            chunkSizeWarningLimit: 2000,
            rollupOptions: {
              output: {
                entryFileNames: `assets/[name].${new Date().getTime()}.js`,
                chunkFileNames: `assets/[name].${new Date().getTime()}.js`,
                assetFileNames: `assets/[name].${new Date().getTime()}.[ext]`,
              },
            },
        },
        optimizeDeps: {
            include: [
                'element-plus/lib/locale/lang/zh-cn',
                'element-plus/lib/locale/lang/en',
                'element-plus/lib/locale/lang/zh-tw'
            ],
        },
        css: {
          postcss: {
            plugins: [
              {
                postcssPlugin: 'internal:charset-removal',
                AtRule: {
                  charset: (atRule) => {
                    if (atRule.name === 'charset') {
                      atRule.remove();
                    }
                  },
                },
              },
            ],
          },
        },
        define: {
            __VUE_I18N_LEGACY_API__: JSON.stringify(false),
            __VUE_I18N_FULL_INSTALL__: JSON.stringify(false),
            __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
        },
        plugins: [
            vue(),
            viteMockServe({
                mockPath: 'mock',
                localEnabled: command !== 'build',
                prodEnabled: command === 'build' && VITE_USE_MOCK,
                watchFiles: true,
                injectCode: `
                import { setupProdMockServer } from '../mock/_createProductionServer';
                setupProdMockServer();
                `,
                ignore: /^\_/,
                logger: true,
            }),
        ],
    }
};
