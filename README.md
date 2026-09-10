# 数据结构自学网站（北京大学主题 · MPA版）

多页面静态站点：首页导航 + 7个学习模块 + 打卡进度，GitHub Pages 直接托管，无后端。

## 文件清单（缺一不可）
- index.html —— 首页导航（全网搜索入口 + 模块卡片 + 打卡小组件）
- wangdao.html —— 王道数据结构同步精讲（8章97节）
- course.html —— 本校课程PPT同步精讲（Lecture 0-26）
- stl.html —— C++ STL 工具接口详解（22组件）
- algorithms.html —— 算法标准模板（33模板）
- exams.html —— 本校期末真题逐题精讲（10套182题，题型/章节筛选）
- practice.html —— STL×算法实战（9题）
- leetcode.html —— 力扣Hot100精讲（67题，难度筛选）
- progress.html —— 打卡进度（日历+连续天数+模块进度条）
- assets/style.css —— 全站公共样式（含夜间模式）
- assets/nav.js —— 全站导航结构数据
- assets/app.js —— 公共脚本（导航/高亮/搜索/筛选/速查卡/已学标记/主题配置）
- assets/checkin.js —— 打卡与进度公共脚本（localStorage + Supabase 双模式）
- assets/manifest.json —— 各页可标记清单（进度条数据源）
- assets/search-index.json —— 全网搜索索引（首页搜索时按需加载）
- .nojekyll —— 关闭 GitHub Pages 的 Jekyll 处理

## 公共配置（localStorage）
夜间模式 ds_night、字号 ds_font、打卡 ds_days、学习进度 ds_reads、设备ID ds_device_id——跨页面、跨标签页自动同步。

## 启用 Supabase 云端同步（可选）
1. 在 supabase.com 免费建项目，SQL Editor 执行：
   create table if not exists ds_state (device text primary key, data jsonb default '{}'::jsonb, updated_at timestamptz default now());
   alter table ds_state enable row level security;
   create policy "ds_state_open" on ds_state for all using (true) with check (true);
2. 编辑 assets/checkin.js 顶部两行，填入 SUPABASE_URL 与 SUPABASE_ANON_KEY。
未配置时自动使用本地模式，功能不受影响。

## 部署（GitHub Pages）
仓库根目录保留以上全部文件即可；本仓库 Pages 已指向 main 分支根目录。
