var posts=["2025/11/28/csp2025游记/","2025/11/29/hexo+github Action部署方案/","2025/11/28/test/","2025/11/30/同余最短路/","2025/11/30/树的直径/","2025/11/08/hello-world/","2025/11/30/树链剖分/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };