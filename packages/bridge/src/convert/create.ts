const createByType = type => (type === 'map' ? {} : type === 'list' ? [] : '')

const opCreate = ({ obj, type }, [map, ops]) => {
  map[obj] = createByType(type)

  return [map, ops]
}

export default opCreate
