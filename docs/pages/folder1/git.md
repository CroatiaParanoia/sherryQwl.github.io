
### 1、查看系统配置：
```js
git config --system --list
```
### 2、查看当前用户全局配置：
```js
git config --global --list
```
### 3、查看当前仓库配置：
```js
git config --local --list
```
### 4、查看本地用户和邮箱
```js
git config user.name/email
```
### 5、配置用户名和邮箱：
``` js
git config [--global] user.name <username>
git config [--global] user.email <email>
```
### 6、查看远程仓库地址：
```js
git remote -v
```
### 7、修改远程仓库地址：
```js
git remote set-url origin <new url>
```
### 8、http协议下保存用户名和密码（避免每次操作都要输入）：
```js
git config --global credential.helper store
```
### 9、合并远程分支代码
```js
git merge --no-f -m "master" master
```

