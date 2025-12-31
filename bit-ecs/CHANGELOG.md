
## 0.1.0
- 重写查询系统,使框架设计更合理,方便扩展
- 添加组件类型或关系的查询，目前支持的有 allOf、anyOf、excludeOf、optionalOf 四种规则配置
## 0.1.1
- 重写查询器获取匹配组件的实现，优化内存占用
## 0.1.2
- World中的addSystem添加链式调用
- 移除ECMAScript 2020 ?.语法的使用