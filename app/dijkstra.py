import heapq


def shortest_path(places, roads, source_id, destination_id):

    graph = {}

    # Build graph
    for place in places:
        graph[place.place_id] = []

    for road in roads:
        graph[road.source_place_id].append(
            (road.destination_place_id, road.distance)
        )
        graph[road.destination_place_id].append(
            (road.source_place_id, road.distance)
        )

    # Initialize distances
    distances = {}

    for node in graph:
        distances[node] = float("inf")

    distances[source_id] = 0

    previous = {}

    pq = [(0, source_id)]

    while pq:

        current_distance, current_node = heapq.heappop(pq)

        if current_distance > distances[current_node]:
            continue

        for neighbour, weight in graph[current_node]:

            distance = current_distance + weight

            if distance < distances[neighbour]:

                distances[neighbour] = distance
                previous[neighbour] = current_node

                heapq.heappush(
                    pq,
                    (distance, neighbour)
                )

    # No path found
    if distances[destination_id] == float("inf"):
        return None

    # Reconstruct path
    path = []

    node = destination_id

    while node != source_id:
        path.append(node)
        node = previous[node]

    path.append(source_id)

    path.reverse()

    return {
        "path": path,
        "distance": distances[destination_id]
    }