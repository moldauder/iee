# API Manual

## DB

### 主操作

* `select` 查询操作，返回数组

### SQL设置方法

* `where` 设置查询条件，支持反复写入。支持传入数组，对于传入的数组，将以AND组合

```
//where `id` > 3 and `id` < 20
$db->where('id > 3');
$db->where('id < 20')
```

* `logic` 设置查询条件之间如何组合，默认组合方式为or

```
//where `id` < 200 or `id` > 500
$db->where('id < 200')->logical('OR')->where('id > 500')
```

* `limit` 设置查询的返回条数

* `table` 设置查询的表格，如果不设置，将使用上一次的设置

* `field` 设置要查询的字段

* `group`

* `order`

* `join`

* `data` 设置要操作的数据，用于update、insert等操作


