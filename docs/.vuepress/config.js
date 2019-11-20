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
      { text: "首页", link: "/" }
      // 格式二：添加下拉菜单，link指向的文件路径
    ]
  }
};
