module.exports = {
  title: "首页", // 显示在左上角的网页名称以及首页在浏览器标签显示的title名称
  description: "sherry的前端记录", // meta 中的描述文字，用于SEO
  //注入到当前页面的 HTML <head> 中的标签
  head: [["link", { rel: "icon", href: "/home.png" }]],
  themeConfig: {
    logo: "/home.png", //网页顶端导航栏左上角的图标
    //   顶部导航栏
    nav: [
      // 格式一：直接跳转，'/'为不添加路由，跳转到首页
      { text: "首页", link: "/" },
      // 格式二：添加下拉菜单，link指向的文件路径
      {
        text: "分类", //默认显示
        ariaLabel: "分类", //用于识别的label
        items: [
          { text: "文章", link: "/pages/folder1/interview.md" },
          //点击标签会跳转至link的markdown文件生成的页面
          { text: "琐碎", link: "/pages/folder2/work.md" }
        ]
      },
      { text: "功能演示", link: "/pages/folder1/test3.md" },
      { text: "Github", link: "https://github.com/sherryQwl" }
    ],
    // 侧边栏导航：会根据当前的文件路径是否匹配侧边栏数据，自动显示/隐藏
    sidebar: {
      "/pages/folder1/": [
        {
          title: "面试汇总", // 一级菜单名称
          collapsable: true, // false为默认展开菜单，默认值true是折叠
          sidebarDepth: 1, //设置侧边导航自动提取markdown文件标题的层级，默认1为h2层级
          children: [
            ["interview.md", "宝典"], // 菜单名称为‘子菜单1’，跳转至/pages/folder1/interview.md
            ["array.md", "数组"],
            ["question.md", "开发问题"]
          ]
        },
        {
          title: "vue理解",
          collapsable: true,
          children: [["vue.md", "vue"]]
        },
        {
          title: "css开发技巧",
          collapsable: true,
          children: [["css.md", "css"]]
        },
        {
          title: "Git常用命令",
          collapsable: true,
          children: [["git.md", "git"]]
        },
        {
          title: "转正答辩",
          collapsable: true,
          children: [["review.md", "review"]]
        },
        {
          title: "节流与防抖",
          collapsable: true,
          children: [["optimize.md", "节流与防抖"]]
        }
      ],
      "/pages/folder2/": [
        {
          title: "工作资料汇总",
          collapsable: true,
          children: [["work.md", "work"]]
        }
      ]
    }
  }
};
